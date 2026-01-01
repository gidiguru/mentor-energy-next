import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4 py-8">
      <div className="w-full max-w-md overflow-visible">
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto w-full overflow-visible',
              card: 'bg-white dark:bg-surface-800 shadow-lg overflow-visible',
              cardBox: 'overflow-visible',
              main: 'overflow-visible',
              form: 'overflow-visible',
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
              // Ensure Cloudflare Turnstile widget is visible
              footer: 'overflow-visible',
            },
          }}
          routing="path"
          path="/signup"
          signInUrl="/auth"
          fallbackRedirectUrl="/auth/complete-signup"
        />
      </div>
    </div>
  );
}
