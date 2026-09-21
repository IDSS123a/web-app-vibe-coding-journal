/**
 * The legal texts (PDL-079), as markdown, one per public page. They are drafts prepared for the Director to review, written
 * from what the app really does (checked against the code on the date below). Two rules for editing them:
 *  1. Every factual sentence must stay true to the code: the prices come from lib/pricing.ts, the limits from the feature
 *     modules, the storage from what the browser really keeps. legal.test.ts checks the numbers.
 *  2. Plain words, no dashes (the project's writing rule), and no promise the app does not keep.
 * The studio is named only by its public name and e-mail address (business location privacy, PDL-015).
 */
import { BASIC_PRICE_USD, PREMIUM_PRICE_USD, TRIAL_DAYS, UPGRADE_PRICE_USD } from "@/lib/pricing";
import { STUDIO, SITE_NAME } from "@/lib/site";
import { SANDBOX_DAILY_CAP_PER_USER } from "@/features/prompt-school/sandbox-limits";
import { ASSISTANT_DAILY_CAP_PER_USER as ASSISTANT_DAILY_LIMIT } from "@/features/prompt-assistant/domain";
import { RENEWAL_WINDOW_DAYS } from "@/features/payments/domain";

export const LEGAL_UPDATED = "21 September 2026";
export const REFUND_DAYS = 14;

const CONTACT = `**${STUDIO.name}**, e-mail [${STUDIO.email}](mailto:${STUDIO.email}), website [${STUDIO.website}](${STUDIO.website}).`;

export const TERMS = `
These terms are the agreement between you and ${STUDIO.name} ("we", "us") for using ${SITE_NAME} (the "Service"). Please read them together with the [Privacy Policy](/privacy), the [Refund Policy](/refunds), the [Subscription and renewal](/subscription) page and the [Cookie notice](/cookies). By creating an account you confirm that you have read and accept them.

## 1. Who we are

${CONTACT} Write to this address for any question about the Service or these terms.

## 2. What the Service is

${SITE_NAME} is a subscription service for people who build software with AI tools. It has two plans:

- **Basic, $${BASIC_PRICE_USD} a year:** the Daily Report, the Archive of past reports, and Bookmarks.
- **Premium, $${PREMIUM_PRICE_USD} a year:** everything in Basic, plus the Vibe-Coding University, the Vibe-Coding Dictionary, the Vibe-Coding Assistant (${ASSISTANT_DAILY_LIMIT} prompts a day), Prompt School (lessons, exercises, level tests, a live sandbox with ${SANDBOX_DAILY_CAP_PER_USER} runs a day), coins, badges and certificates.

A Basic subscriber can move to Premium for a one-time $${UPGRADE_PRICE_USD}. The prices are stated in US dollars and are fixed. The price you see at checkout is the price you pay.

## 3. Free trial

A new account gets a trial of ${TRIAL_DAYS} days with Premium access. No payment details are needed to start it. When the trial ends, paid content is closed until you subscribe. Your account and progress are kept.

## 4. Your account

- You must be at least 16 years old and give a real e-mail address.
- One account is for one person. Do not share your sign-in or pass access on to others.
- Keep your password safe. You are responsible for what happens under your account. Tell us at once if you think someone else has used it.

## 5. Payment, renewal and refunds

Payment is made through PayPal. A subscription lasts 12 months from the day your payment is confirmed and does **not** renew by itself. When you upgrade from Basic to Premium, a new 12 months start on the day you pay the $${UPGRADE_PRICE_USD}. The details are on the [Subscription and renewal](/subscription) page. Refunds are covered by the [Refund Policy](/refunds).

## 6. What you may and may not do

You may use the Service for your own learning and work. You may not:

- copy, resell, republish or share the reports, lessons, dictionary or course material beyond short quotations with a link back to us;
- use robots or scripts to collect content from the Service, or try to get around the account, payment or usage limits;
- attack, probe or overload the Service, or try to reach other people's data;
- use the Assistant or the sandbox to produce unlawful, hateful, sexual or harmful material, or to send us other people's personal data.

We may block an account that breaks these rules. If we block an account without a good reason, we will restore it or refund the remaining period.

## 7. Content, AI and accuracy

The reports, lessons, exercises, definitions and answers in the Service are prepared with the help of AI tools and are meant to inform and teach, not to advise. They can be incomplete or wrong. Check anything important against the original source before you rely on it, in particular anything about security, money, law or health. Nothing here is professional advice.

The Prompt School follows the book *Mastering Prompt Engineering* by Davor Mulalić. The book is sold separately and is not part of a subscription.

## 8. Your prompts and what you enter

What you type into the Assistant or the sandbox is yours. You allow us to process it, and to send it to our AI provider, only to give you the answer and to run the Service. Because it goes to an external AI provider (see the [Privacy Policy](/privacy)), do not enter passwords, secrets, customer data or other personal data.

## 9. Our rights in the Service

The Service, its design, texts, structure and software belong to ${STUDIO.name} or its licensors. We give you a personal, non-transferable right to use them while your access is active. Everything you create yourself stays yours.

## 10. Availability and changes

We work to keep the Service running, but we cannot promise it will always be available or free of errors. It depends on services of other companies (hosting, database, payments, e-mail, AI). We may change, add or remove features. If we remove a paid feature in a way that makes your plan clearly worth less, you may ask for a refund of the remaining period.

## 11. Liability

Nothing in these terms limits our liability where the law does not allow it, including for intent, gross negligence, injury to life, body or health, or your rights as a consumer. Beyond that, we are liable only for foreseeable damage caused by a breach of an essential obligation, and never for lost profit, lost data that you could have backed up, or for decisions you made on the basis of the content. Our total liability for one subscription is limited to the amount you paid for it.

## 12. Ending the agreement

You can stop using the Service at any time and ask us to delete your account (see the [Privacy Policy](/privacy)). We can end the agreement if you seriously or repeatedly break these terms, or if we close the Service, in which case we refund the unused part of your period.

## 13. Changes to these terms

We may update these terms. If a change matters for you, we tell you by e-mail or on the site before it applies. If you keep using the Service after that, the new terms apply. The date at the top of this page is the date of the current version.

## 14. Consumer rights and disputes

If you are a consumer, the mandatory consumer protection rules of the country where you live continue to apply and are not reduced by these terms. Please contact us first at ${STUDIO.email}; most questions can be solved quickly.
`;

export const PRIVACY = `
This policy explains what personal data ${SITE_NAME} collects, why, who else handles it, how long we keep it, and what rights you have. It follows the EU General Data Protection Regulation (GDPR).

## 1. Who is responsible

The controller is ${CONTACT} For anything about your data, write to ${STUDIO.email}.

## 2. What we collect and why

| What | Why | Legal basis (GDPR Art. 6) |
|---|---|---|
| **Account:** e-mail address, password (kept only as a one-way hash by our sign-in provider, we never see it), the AI tools you tick and the depth you choose at sign-up, optional text about other tools | To create and run your account and personalise the Service | Contract (1)(b) |
| **Plan:** trial dates, plan, status, end date, whether the account is blocked | To give you the access you paid for | Contract (1)(b) |
| **Payments:** PayPal transaction and event numbers, amount, date, and the payer details PayPal sends us (such as the payer name and e-mail). We never receive your card or PayPal password. | To confirm and record your payment, handle refunds, and keep the accounts | Contract (1)(b), legal obligation (1)(c) |
| **Learning and use:** bookmarks, reports you open, coins, levels, streaks, badges, University and Prompt School progress, exercise and test results | To run the Service and show your progress | Contract (1)(b) |
| **Assistant:** what you enter in the wizard and the prompt that is generated, kept in your history until you delete it | To give you the result and your history | Contract (1)(b) |
| **Sandbox:** the fact that a run happened (time, task, length). The text you write is sent to the AI to get the answer and is **not** stored by us. | To enforce the daily limit | Legitimate interest (1)(f) |
| **Technical:** the address and browser details your device sends with each request, kept in the hosting provider's logs for a short time | Security, fault finding, abuse prevention | Legitimate interest (1)(f) |
| **E-mail we send you:** reminders before your plan ends and messages about your account | To keep you informed about your plan | Contract (1)(b) |

We do not sell your data, we do not show advertising, and we do not use tracking or analytics tools. We do not make decisions about you by automated means that have legal or similarly significant effects.

## 3. Who else handles your data (processors)

We use these providers, each under a data processing agreement or standard terms:

- **Supabase**, database and sign-in. Our project runs in the EU (Ireland).
- **Vercel**, hosting of the website and its server functions (servers may be in the United States).
- **PayPal**, payments. PayPal is an independent controller for the payment itself and has its own privacy statement.
- **Resend**, sending e-mail.
- **Google (Gemini API)**, the AI that answers the Assistant and the sandbox. The text you enter there is sent to Google. **On the free tier we use, Google may use such content to improve its services, and people at Google may read it.** This is why you must not enter personal data or secrets into the Assistant or the sandbox.

Where a provider is outside the European Economic Area, the transfer is covered by the European Commission's standard contractual clauses or an adequacy decision. We give data to authorities only when the law requires it.

## 4. How long we keep it

- **Account, progress and history:** as long as your account exists. When you ask us to delete your account we do it within 30 days, usually sooner.
- **Assistant history:** until you delete an item (the Delete button in History). The text is removed at once. Only an empty record with the date stays, so that the daily limit is counted correctly.
- **Payment records:** for as long as accounting and tax law require, even after the account is deleted. They are not used for anything else.
- **Hosting logs:** a short period set by the provider.
- **Backups:** overwritten on a rolling schedule; deleted data disappears from them in that way.

## 5. Your rights

You have the right to: **access** your data and get a copy; have wrong data **corrected**; have your data **erased**; **restrict** or **object to** its use; receive it in a usable format (**portability**); **withdraw consent** where we rely on it; and **complain to a data protection authority**, in particular where you live or work. To use any of these rights, write from your account address to ${STUDIO.email}. We answer within 30 days. We may ask you to confirm who you are.

## 6. Children

The Service is not for people under 16. If you think a child has given us data, write to us and we will delete it.

## 7. Security

Data travels over encrypted connections. Passwords are stored only as hashes. The database is closed by default, and every request is checked for who you are and what your plan allows before data is returned. No system is perfectly safe; if a breach affects your rights, we tell you and the authority as the law requires.

## 8. Cookies and similar storage

We keep only what the Service needs to work. See the [Cookie notice](/cookies).

## 9. Changes

We will update this policy when the Service changes and show the date above. If a change matters for you, we tell you before it applies.
`;

export const REFUNDS = `
We want you to be sure before you commit. This policy applies to every payment made on ${SITE_NAME}.

## 1. ${REFUND_DAYS} day money back guarantee

If you are not happy, ask for a full refund within **${REFUND_DAYS} days of the day you paid**. You do not need to give a reason. This applies to the Basic plan ($${BASIC_PRICE_USD}), the Premium plan ($${PREMIUM_PRICE_USD}) and the upgrade from Basic to Premium ($${UPGRADE_PRICE_USD}).

## 2. How to ask

Write to [${STUDIO.email}](mailto:${STUDIO.email}) from the e-mail address of your account, and say that you want a refund. Adding the PayPal transaction number helps, but is not required. We answer within 3 working days.

## 3. How you get the money

We refund the whole amount to the PayPal account or card you paid with. PayPal usually shows it within 5 working days after we approve it. There are no fees on our side.

## 4. What happens to your access

- A refunded **Basic or Premium** payment ends the paid access. Your account and progress stay, and you can subscribe again at any time.
- A refunded **upgrade** ($${UPGRADE_PRICE_USD}) returns your account to Basic for the rest of the period you originally paid for.

## 5. After ${REFUND_DAYS} days

After ${REFUND_DAYS} days we refund only where the law requires it, or where we are at fault: for example, if the paid part of the Service was not available to you for a long time and we could not fix it, or if we end the Service or your account without a good reason. In those cases we refund the unused part of your period.

## 6. Your legal rights

This policy is in addition to your rights under mandatory consumer law, such as a statutory right of withdrawal or a remedy for faulty digital content. It never reduces them.

## 7. Book

The book *Mastering Prompt Engineering* is sold separately through its own PayPal payment page. Write to us at ${STUDIO.email} about a refund for the book.
`;

export const SUBSCRIPTION = `
How ${SITE_NAME} plans work, in plain words.

## Plans and prices

| Plan | Price | What it includes |
|---|---|---|
| **Basic** | $${BASIC_PRICE_USD} a year | Daily Report, Archive, Bookmarks |
| **Premium** | $${PREMIUM_PRICE_USD} a year | Everything in Basic, plus University, Dictionary, Assistant, Prompt School, coins, badges and certificates |
| **Upgrade** Basic to Premium | $${UPGRADE_PRICE_USD} once | Moves your account from Basic to Premium |

The prices are in US dollars and are fixed. The price you see at checkout is the price you pay. We add nothing on top.

## One payment, no automatic renewal

You pay once, through PayPal. **Your plan does not renew by itself and we never charge you again without you paying on purpose.** There is no recurring billing to cancel.

## How long a plan lasts

A plan lasts **12 months from the day your payment is confirmed.**

When you **upgrade** from Basic to Premium, a **new 12 months start on the day you pay the $${UPGRADE_PRICE_USD}**, so you get a full year of Premium from that day.

## Reminders and renewing

We send you an e-mail 7 days and again 2 days before your plan ends. To renew, sign in and pay again on the subscription screen. You can renew in the last ${RENEWAL_WINDOW_DAYS} days of your plan, or at any time after it has ended; while your plan has more than ${RENEWAL_WINDOW_DAYS} days left, the site does not let you pay for it a second time. If you renew early, the new 12 months start when your current year ends, so nothing you paid for is lost. If your plan has already ended, they start on the day you pay.

## When a plan ends

Paid content is closed. Your account, progress, coins, badges and history are kept, so when you subscribe again, everything is there.

## Trial

A new account has ${TRIAL_DAYS} days with Premium access, free, without payment details.

## Refunds and questions

See the [Refund Policy](/refunds): ${REFUND_DAYS} days, full refund, no reason needed. For anything else write to [${STUDIO.email}](mailto:${STUDIO.email}).
`;

export const COOKIES = `
${SITE_NAME} keeps on your device only what it needs to work. We do not use advertising, tracking or analytics cookies.

## What is stored

| What | Where | What for | How long |
|---|---|---|---|
| Your sign-in session | Your browser's local storage | To keep you signed in | Until you sign out |
| The reading timer for the book pop-up | Session storage | To time the pop-up in Prompt School | Until you close the tab |
| That you have seen this notice | Local storage | Not to show it again | Until you clear your browser data |

## PayPal

When you open a payment screen, PayPal's own script loads and PayPal may set its own cookies to run the payment and prevent fraud. That is PayPal's processing, described in [PayPal's privacy statement](https://www.paypal.com/webapps/mpp/ua/privacy-full).

## Your choices

Everything above is needed for the Service to work, so there is nothing to switch off. You can delete the stored data in your browser settings at any time; you will then be signed out. If we ever add anything that is not strictly necessary, we will ask you first.

More about your data in the [Privacy Policy](/privacy). Questions: [${STUDIO.email}](mailto:${STUDIO.email}).
`;

export const LEGAL_PAGES = [
  { path: "/terms", title: "Terms of Use", markdown: TERMS },
  { path: "/privacy", title: "Privacy Policy", markdown: PRIVACY },
  { path: "/refunds", title: "Refund Policy", markdown: REFUNDS },
  { path: "/subscription", title: "Subscription and renewal", markdown: SUBSCRIPTION },
  { path: "/cookies", title: "Cookie notice", markdown: COOKIES },
] as const;
