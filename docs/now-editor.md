# Now editor

The multilingual latest status is a manual personal update, independent of the routine.
Recurring activities appear beside the clock and current focuses and are stored in the Prisma models NowStatusSlot and
NowStatusSlotTranslation, linked to NowSettings. No database JSON field is used.

Start and end times are minutes after midnight in the configured IANA time zone.
Weekdays use Sunday = 0 through Saturday = 6. An end earlier than the start crosses
midnight; equal times mean a full day. Overlapping weekly ranges are rejected.
The public status refreshes locally every thirty seconds and describes an approximate
routine, not real-time availability. There are no one-day exceptions or cron jobs.

Focus order is changed in the list using the shared Sortable component. New records
are appended. Reorders validate ownership and the complete set of IDs inside a transaction.

GitHub is a per-user integration at Admin → Integrations → GitHub. Credentials use
the existing typed IntegrationConfigMap and encrypted TenantIntegration.credentialsEnc
storage. The browser receives only a masked token and the verified account name.
Saving verifies the account and access to the contribution calendar before storing it.
It also synchronizes the Now GitHub username.

Contribution data comes from the GitHub GraphQL contributionCalendar API:
https://docs.github.com/en/graphql/reference/users#contributioncalendar

Only the server decrypts the token. Requests are cached for an hour with the account
and authorization included in the cache key. Disconnected users do not use that cached
data because credentials are resolved on every request. No environment token, shared
account fallback, third-party widget or simulated contribution count is used.

Without credentials, a configured username produces a GitHub profile link.
API failures and expired tokens produce a non-blocking unavailable state.
Book and movie covers use the optional String fields readingCoverUrl and watchedCoverUrl.
The editor uploads them using the active user's UploadThing integration, or accepts an image URL.
Missing reading, film, cover and photo entries use empty states rather than demo content.

The latest GitHub activity comes from the official public user events API, using the
same verified per-user credential. Only public events by the configured account are
shown. Responses are cached for five minutes; GitHub may delay events, so this is
not a live activity indicator. No manual repository/activity fields are retained.
The contribution explorer uses the public canonical pill tabs: building blocks,
calendar and an optional Breakout game. The public page follows the supplied
Now HTML reference: centered editorial hero with a large local clock and a daily
routine rail, focus columns, three media columns, public GitHub activity, large
metrics, the contribution explorer and a horizontal language distribution.
The existing global navigation/footer and all theme tokens remain in use.
Photos and manual status still come from the CMS. No example values from the HTML
are copied into tenant data. The single clock drives both the time and routine rail,
including overnight ranges. Hero padding is inside the gradient section so there
is no separate strip above it. Personal photos have small alternating tilts and
vertical offsets, with reduced-motion-aware hover effects.

Blocks have a projected 3D camera with rotation, pan, zoom and reset. Mouse/touch
and keyboard controls stay local to the graph. Blocks draw on a canvas rather than
updating thousands of React/SVG nodes. Drawing is coalesced to one animation frame
per input/resize/theme change; there is no idle render loop. Relieves use projected
ellipses rather than repeatedly tessellated polygons. Calendar scrolling stays
contained and the game fits its viewport. Every lazy visualization has a local
Suspense boundary, so switching tabs cannot suspend the entire page.

The routine editor shows a compact list. A dialog edits one activity at a time,
with every-day, weekday, weekend or custom-day repeats. Overnight ranges are
explained and overlaps name the conflicting activity. Applying a dialog updates
the form; saving the Snapshot tab persists the routine. Existing IDs and all localized
text are preserved when an activity is edited.

Public hover effects use motion/react and respect reduced motion. The calendar
cells scale inward. Breakout is player-controlled: pointer/touch, left/right arrows
or A/D move the paddle, Space starts/pauses and Escape pauses. Three lives, score,
win/loss and restart are local to the component. Score sums the contributions in
cleared bricks. The ball uses fixed-speed motion and substep collision handling;
there is no automatic aiming or paddle tracking. Losing a life requires relaunch.
Focus loss, a hidden browser tab and leaving the viewport pause the game. Reduced
motion disables decorative effects, while the game starts only by explicit user
action. It never changes GitHub data or writes gameplay data to the database.

The language bar replaces the donut and radar from the previous layout. Summary
metrics use the same contribution collection as the calendar. The GitHub GraphQL
query uses the tenant credential on the server only. Repository statistics sample up to 100
most recently updated public, owned, non-fork repositories. Language shares are
code bytes, not skill proficiency; additional languages are grouped as Other.
Stars/forks are totals within that sample, and the UI explicitly reports its size.
Missing analytics do not prevent rendering a valid calendar. All visualizations
use semantic theme tokens and lazy-load through the explorer; no extra library,
database field or GitHub Action configuration is required.

Now saves per tab through the typed nowAdmin.saveTab contract. Activity uses a
single settings write and cannot change status or routine data. GitHub updates
only the username. Snapshot validates its schedule and writes only changed
activities and translation rows through nested Prisma writes in one transaction.
Removed activity IDs are explicitly scoped to the existing user's routine.
The transaction allows fifteen seconds and retries write conflicts at most twice.
Successful saves retain draft fields from other tabs and return persisted routine
IDs to prevent creating the same new activity again on the next save.
