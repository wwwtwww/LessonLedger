# LESSONLEDGER_COMPONENT_SPEC.md

Version: 1.0
Purpose: Ensure 100% Figma fidelity for LessonLedger UI components. Gemini/AI MUST strictly follow this spec.

##################################################
# GLOBAL COMPONENT STYLING
##################################################

- Base Width: 390px (iPhone 16 Pro)
- Max Content Width: 430px
- Font Family: SF Pro Display
- Font Weights: Regular 400, SemiBold 600, Bold 700
- Base Radius: 24px
- Spacing Unit: 8px (XS), 16px (MD), 24px (LG), 32px (XL)
- Shadow: y:8, blur:30, color: rgba(0,0,0,0.08)

Haptics:

- Tap: light impact
- Switch Member: medium impact
- Card Press: soft impact

Animation:

- Default Duration: 300ms
- Easing: easeOut

##################################################
# GLASS HEADER
##################################################

- Height: 72px
- Padding Horizontal: 24px
- Background: rgba(255,255,255,0.3)
- Blur Intensity: 60
- Layout: Horizontal
  - Left: Logo 24px
  - Right: Language Switch 24px
- Shadow: none
- Z-index: 10
- Animation: fade in 200ms on mount

##################################################
# SUMMARY CARD
##################################################

- Layout: Grid 2x2, gap 16px
- Card Size: Width: calc(50%-8px), Height:120px
- Radius: 24px
- Padding: 16px
- Background: #FFFFFF with subtle shadow
- Content:
  - Icon: 24x24px top-left
  - Value: 24px Bold, top-center
  - Label: 15px Regular, bottom-left
- Progress/Indicator bars if applicable: Height 8px, radius 999
- Animation: scale 1.0 → 1.02 on press, duration 120ms

##################################################
# MEMBER SWITCHER
##################################################

- Container Height: 88px
- Horizontal Scroll: true
- Card Size: Width:72px, Height:72px
- Radius:24px
- Active Member:
  - Scale: 1.08
  - Border: 2px #6366F1
  - Background: rgba(99,102,241,0.08)
- Inactive Member:
  - Scale:1.0
  - Border: transparent
- Spacing between cards: 16px
- Animation: Reanimated spring
  - Damping:20, Stiffness:180
  - Duration:300ms
- Haptics: Medium impact on switch

##################################################
# WARNING COURSES
##################################################

- Position: Below Member Switcher
- Margin Top:24px
- Card:
  - Height:160px
  - Radius:24px
  - Padding:20px
  - Shadow: y:8, blur:30, rgba(0,0,0,0.08)
  - Background:#FFFFFF
- Layout:
  - Top: Course Name (18px SemiBold)
  - Left: Member Badge (28x28px, radius 14px)
  - Center: Progress Bar (Height:8px, radius:999)
  - Bottom: Remaining Lessons (15px Regular)
  - Action Button: Height 48px, Radius 16px, Width 100%, background: #6366F1 or #22C55E depending
- Alert State:
  - Remaining <= 3: Text color #EF4444
- Animation:
  - Card press: scale 0.97, duration 120ms
  - Progress bar smooth transition: 250ms easeOut

##################################################
# RECENT LOGS
##################################################

- Position: Below Warning Courses
- Margin Top:24px
- LogItem:
  - Height:72px
  - Avatar: 40x40px, radius 20px
  - Course Name: 18px SemiBold
  - Timestamp: 13px Regular
  - Divider Bottom: 1px #E2E8F0
- Animation: fade-in 200ms on mount

##################################################
# COURSE CARD DETAIL (if modal)
##################################################

- Card Height: 180px
- Radius:24px
- Content Layout:
  - Top: Course Name 18px SemiBold
  - Middle: Member Badge + Price + Progress
  - Bottom: Remaining Lessons + Action Buttons
- Buttons:
  - Height:48px
  - Radius:16px
  - Width:100%
  - Background color based on type: #6366F1 / #22C55E

##################################################
# BOTTOM SHEETS
##################################################

- Radius:32px
- Background:#FFFFFF
- Handle: width:40px, height:5px, center aligned
- Fields Padding Vertical: 16px
- Save Button:
  - Height:56px
  - Radius:16px
  - Background:#6366F1
- Animation: spring damping:20 stiffness:180

##################################################
# ANIMATIONS
##################################################

- Member Switch: spring 300ms, easeOut
- Card Press: scale 0.97, 120ms
- Bottom Sheet Open/Close: spring damping 20, stiffness 180
- Progress Bar Smooth: duration 250ms easeOut

##################################################
# STRICT RULES
##################################################

- AI MUST NOT invent new sections
- AI MUST NOT move section order
- AI MUST NOT create charts or graphs
- AI MUST NOT change component dimensions
- AI MUST NOT create desktop layout
- AI MUST strictly follow this spec for all mobile screens

END OF COMPONENT SPEC