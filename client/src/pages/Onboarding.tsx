import React from 'react';
import AuthLayout from '../components/auth-components/AuthLayout';
import OnboardingForm from '../components/onboarding-components/OnboardingForm';

const Onboarding: React.FC = () => {
    return (
        <AuthLayout maxWidth="max-w-2xl">
            <OnboardingForm />
        </AuthLayout>
    );
};

export default Onboarding;
