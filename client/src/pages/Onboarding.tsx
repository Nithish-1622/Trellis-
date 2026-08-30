import React from 'react';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';

const Onboarding: React.FC = () => {
    return (
        <div>
            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
                <OnboardingWizard />
            </main>
        </div>
    );
};

export default Onboarding;
