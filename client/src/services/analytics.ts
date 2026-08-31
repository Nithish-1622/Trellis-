import type { OnboardingStep } from './onboardingService'

export type OnboardingAnalyticsEvent =
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'onboarding_validation_failed'
  | 'onboarding_abandoned'
  | 'onboarding_completed'

export const trackOnboardingEvent = (
  event: OnboardingAnalyticsEvent,
  step?: OnboardingStep,
) => {
  window.dispatchEvent(
    new CustomEvent('trellis:analytics', {
      detail: { event, ...(step ? { step } : {}) },
    }),
  )
}
