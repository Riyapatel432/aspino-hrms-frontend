# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\login.spec.js >> HR Login
- Location: tests\login.spec.js:3:5

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - img "Aspino Logo" [ref=e7]
        - generic [ref=e9]:
          - heading "Aspino" [level=1] [ref=e10]
          - heading "Speciality" [level=2] [ref=e11]
          - paragraph [ref=e12]: Chemicals Private Limited
      - generic [ref=e14]:
        - generic [ref=e20]:
          - heading "Trusted Quality" [level=3] [ref=e21]
          - paragraph [ref=e22]: Premium medicines you can trust.
        - generic [ref=e27]:
          - heading "Innovation" [level=3] [ref=e28]
          - paragraph [ref=e29]: Science-driven solutions for better health.
        - generic [ref=e34]:
          - heading "Patient First" [level=3] [ref=e35]
          - paragraph [ref=e36]: Dedicated to improving lives every day.
    - generic [ref=e38]:
      - generic [ref=e43]:
        - heading "Secure HR Access" [level=2] [ref=e44]
        - paragraph [ref=e45]: Enter your HRMS credentials
      - separator [ref=e46]
      - generic [ref=e47]:
        - generic [ref=e48]:
          - generic [ref=e49]: Email Address
          - textbox "Email Address" [ref=e51]:
            - /placeholder: hr@aspino.com
            - text: hr@aspino.com
        - generic [ref=e52]:
          - generic [ref=e53]: Password
          - generic [ref=e54]:
            - textbox "Password" [ref=e55]:
              - /placeholder: ••••••••
              - text: Hr@12
            - button [ref=e56]
          - paragraph [ref=e57]: Password must be at least 6 characters long.
        - generic [ref=e58]:
          - generic [ref=e59]:
            - checkbox "Remember Me" [checked] [ref=e60]
            - checkbox [checked]
            - generic [ref=e61] [cursor=pointer]: Remember Me
          - button "Forgot Password?" [ref=e62] [cursor=pointer]
        - button "Secure HR Login" [active] [ref=e63]
      - generic [ref=e66]: Quick Select Role
      - generic [ref=e69]:
        - button "HR Manager" [ref=e70] [cursor=pointer]
        - button "Employee" [ref=e75] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e86] [cursor=pointer]
  - alert [ref=e90]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('HR Login', async ({ page }) => {
  4  |   await page.goto('http://localhost:3000/login');
  5  | 
  6  |   // Fill email
  7  |   await page.locator('#email').fill('hr@aspino.com');
  8  | 
  9  |   // Fill password
  10 |   await page.locator('#password').fill('Hr@12');
  11 | 
  12 |   // Click Login
  13 |   await page.getByRole('button', { name: /Secure HR Login/i }).click();
  14 | 
  15 |   // Wait for navigation
> 16 |   await page.waitForURL('**/dashboard', { timeout: 10000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  17 | 
  18 |   // Verify dashboard
  19 |   await expect(page).toHaveURL(/dashboard/);
  20 | });
```