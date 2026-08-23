# Responsive layout

The supported breakpoints are mobile below 768 px, tablet portrait from 768 through 1023 px, tablet landscape/small desktop from 1024 through 1199 px, desktop from 1200 through 1439 px, and wide desktop at 1440 px and above. Layouts must remain usable without horizontal page overflow at 320 px and at 200% zoom.

The responsive contract uses CSS viewport widths rather than device names. The reference viewports are 390 px for iPhone 12, 768 px for iPad portrait, 1024 px for iPad landscape, 1280 px for standard desktop, and 1440 px or wider for large screens. A device's available CSS width may vary with display scaling.

Desktop uses a persistent left sidebar. Mobile uses five bottom destinations: Today, Plan, Recipes, Shopping, and More. More links to Products, Settings, and account actions. Bottom navigation respects safe-area insets and never covers the final actionable content.

The desktop meal planner shows a seven-column weekly calendar with four photo-card slots per day; tablet and intermediate widths scroll the complete week inside the calendar region. Mobile uses a seven-day strip and four full-width slots for the selected day. Recipe selection is a desktop dialog and a full-height mobile drawer; recipe details preserve plan context. All actions remain keyboard accessible and preserve visible focus.
