import { expect, test } from '@playwright/test'

const session = {
  session_id: 'session-1',
  status: 'in_progress',
  current_step: 'goal',
  completed_steps: [],
  draft: {
    goal: null,
    current_position: null,
    previous_learning: null,
    preferences: null,
  },
  updated_at: null,
  completed_at: null,
}

test.beforeEach(async ({ page }) => {
  await page.route('**/v1/account/jwts', async (route) => {
    await route.fulfill({ json: { jwt: 'browser-test-jwt' } })
  })
  await page.route('**/v1/account', async (route) => {
    await route.fulfill({
      json: {
        $id: 'learner-1',
        $createdAt: '2026-08-30T00:00:00.000+00:00',
        $updatedAt: '2026-08-30T00:00:00.000+00:00',
        name: 'Pilot Learner',
        registration: '2026-08-30T00:00:00.000+00:00',
        status: true,
        labels: [],
        passwordUpdate: '',
        email: 'learner@example.test',
        phone: '',
        emailVerification: true,
        phoneVerification: false,
        mfa: false,
        prefs: {},
        targets: [],
        accessedAt: '2026-08-30T00:00:00.000+00:00',
      },
    })
  })
  await page.route('**/v1/me/onboarding', async (route) => {
    if (route.request().method() === 'POST') {
      const update = route.request().postDataJSON()
      await route.fulfill({ json: { ...session, ...update, session_id: 'session-1' } })
      return
    }
    await route.fulfill({ json: session })
  })
})

test('onboarding is usable on a mobile viewport and keeps focus in the current step', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/onboarding')

  const heading = page.getByRole('heading', { name: 'What do you want to achieve?' })
  await expect(heading).toBeVisible()
  await expect(heading).toBeFocused()

  await page.getByLabel('What do you want to achieve?').fill(
    'I want to become a backend engineer within twelve months.',
  )
  await page.getByLabel('Target role').fill('Backend Engineer')
  await page.getByLabel('Learning objective').fill('Build reliable services')
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { name: 'Where are you starting from?' })).toBeFocused()
  await expect(page.getByText('Step 2 of 5')).toBeVisible()
})

test('saved onboarding can retry roadmap generation without repeating answers', async ({ page }) => {
  await page.route('**/v1/roadmaps', async (route) => {
    await route.fulfill({ status: 503, json: { error: { code: 'PROVIDER_UNAVAILABLE', message: 'Roadmap generation is temporarily unavailable.' } } })
  })
  await page.goto('/onboarding')

  await page.getByLabel('What do you want to achieve?').fill('I want to become a backend engineer within twelve months.')
  await page.getByLabel('Target role').fill('Backend Engineer')
  await page.getByLabel('Learning objective').fill('Design, test, and deploy reliable APIs')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Where are you starting from?' })).toBeVisible()

  await page.getByLabel('Current role').fill('Frontend Developer')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'What have you already learned?' })).toBeVisible()

  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'How should learning fit your life?' })).toBeVisible()
  await page.getByLabel('Hours available each week').fill('8')
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { name: 'Review your learning profile' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirm and create roadmap' }).click()

  await expect(page.getByRole('alert')).toContainText('Your profile is saved.')
  await expect(page.getByRole('button', { name: 'Retry roadmap generation' })).toBeVisible()
  await expect(page.getByText('Backend Engineer')).toBeVisible()
})
