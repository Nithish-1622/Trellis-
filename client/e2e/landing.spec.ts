import { expect, test } from '@playwright/test'

test('learner can reach account registration from the landing page', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your career')

  const startLink = page.getByRole('link', { name: 'Start Free Trial' })
  await expect(startLink).toBeVisible()
  await startLink.click()

  await expect(page).toHaveURL(/\/register$/)
  await expect(page.getByRole('heading', { name: 'Create an Account' })).toBeVisible()
})
