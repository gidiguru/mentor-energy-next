import { SignIn } from '@clerk/nextjs';

export default function AuthPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-white dark:bg-surface-800 shadow-lg',
            headerTitle: 'text-surface-900 dark:text-white',
            headerSubtitle: 'text-surface-600 dark:text-surface-400',
            socialButtonsBlockButton:
              'bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 border-surface-300 dark:border-surface-600',
            socialButtonsBlockButtonText: 'text-surface-900 dark:text-white',
            formFieldLabel: 'text-surface-700 dark:text-surface-300',
            formFieldInput:
              'bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 text-surface-900 dark:text-white',
            footerActionLink: 'text-primary-500 hover:text-primary-600',
            formButtonPrimary:
              'bg-primary-500 hover:bg-primary-600 text-white',
          },
        }}
        routing="path"
        path="/auth"
        signUpUrl="/signup"
        afterSignInUrl="/dashboard"
      />
    </div>
  );
}
