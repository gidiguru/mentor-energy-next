import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, learningModules, userModuleProgress, users, eq, and } from '@/lib/db';

interface PrerequisiteStatus {
  moduleId: string;
  moduleTitle: string;
  isCompleted: boolean;
}

interface Props {
  params: Promise<{ moduleId: string }>;
}

// GET /api/modules/[moduleId]/prerequisites - Check if user has completed prerequisites
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { moduleId } = await params;
    const { userId: clerkId } = await auth();

    const database = db();

    // Get the module
    const module = await database.query.learningModules.findFirst({
      where: eq(learningModules.moduleId, moduleId),
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // If no prerequisites, user can access
    const prerequisites = module.prerequisites as string[] | null;
    if (!prerequisites || prerequisites.length === 0) {
      return NextResponse.json({
        canAccess: true,
        prerequisites: [],
        incompletePrerequisites: [],
      });
    }

    // If not logged in, they can't have completed prerequisites
    if (!clerkId) {
      // Get prerequisite module info for display
      const prereqModules = await database.query.learningModules.findMany({
        where: (modules, { inArray }) => inArray(modules.moduleId, prerequisites),
      });

      const prereqStatus: PrerequisiteStatus[] = prereqModules.map(m => ({
        moduleId: m.moduleId,
        moduleTitle: m.title,
        isCompleted: false,
      }));

      return NextResponse.json({
        canAccess: false,
        prerequisites: prereqStatus,
        incompletePrerequisites: prereqStatus,
        message: 'Please sign in to track your progress',
      });
    }

    // Get user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get prerequisite modules
    const prereqModules = await database.query.learningModules.findMany({
      where: (modules, { inArray }) => inArray(modules.moduleId, prerequisites),
    });

    // Get user's completion status for prerequisites
    const prereqIds = prereqModules.map(m => m.id);
    const userProgress = await database.query.userModuleProgress.findMany({
      where: and(
        eq(userModuleProgress.userId, user.id),
      ),
    });

    // Filter to only prerequisite modules
    const prereqProgress = userProgress.filter(p => prereqIds.includes(p.moduleId));

    // Build prerequisite status
    const prereqStatus: PrerequisiteStatus[] = prereqModules.map(m => {
      const progress = prereqProgress.find(p => p.moduleId === m.id);
      return {
        moduleId: m.moduleId,
        moduleTitle: m.title,
        isCompleted: progress?.isCompleted ?? false,
      };
    });

    const incompletePrerequisites = prereqStatus.filter(p => !p.isCompleted);
    const canAccess = incompletePrerequisites.length === 0;

    return NextResponse.json({
      canAccess,
      prerequisites: prereqStatus,
      incompletePrerequisites,
      message: canAccess
        ? undefined
        : `Please complete ${incompletePrerequisites.length === 1 ? 'the prerequisite course' : 'all prerequisite courses'} before accessing this module`,
    });
  } catch (error) {
    console.error('Error checking prerequisites:', error);
    return NextResponse.json({ error: 'Failed to check prerequisites' }, { status: 500 });
  }
}
