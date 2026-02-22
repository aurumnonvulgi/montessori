export type MaterialTeachersGuideData = {
  title: string;
  purpose: string;
  whatsIncluded: string;
  keyLanguage: string[];
  presentationNotes: string;
  controlOfError: string;
  observeFor: string;
  extensions: string[];
  readiness: string;
};

export const NUMBER_RODS_TEACHERS_GUIDE: MaterialTeachersGuideData = {
  title: "Number Rods (Teacher's Guide)",
  purpose:
    "The Number Rods give the child a first clear, linear experience of quantity from 1-10. Each rod represents a whole quantity that can be touched, counted, compared, and named - building one-to-one correspondence, stable number sequence, and the understanding that each number name matches a distinct amount. This work prepares the child for later connections to numerals and for early operations by making quantity visible and physical.",
  whatsIncluded:
    "A set of ten rods increasing in equal increments: the first is 10 cm and each rod increases by 10 cm up to 100 cm. Each rod is divided into 10 cm segments that alternate red and blue, creating a clear track for counting while keeping the quantity concrete and easy to discriminate.",
  keyLanguage: [
    '"This is one."',
    '"One, two... This is two."',
    '"Let\'s count together."',
    '"Show me five." / "What is this?"',
    '"___ is longer than five." / "___ is shorter than five."',
    '(Later) "Nine plus one equals ten." / "Ten take away one leaves nine."',
  ],
  presentationNotes:
    'Invite the child to carry the rods to a rug and build them in graded order with the left ends aligned. Count each rod by touching one segment at a time from left to right, then glide your hand along the whole rod and name it as a complete quantity ("This is six"). Keep words minimal, movements precise, and repeat only as much as the child needs to internalize the sequence. Best practice: return to "one" often and use it to "measure" longer rods when the child is ready to explore relationships.',
  controlOfError:
    "The child can self-correct visually: the graded lengths, aligned ends, and alternating segments make mistakes in order, alignment, or counting obvious.",
  observeFor:
    "Readiness: the child can count with one-to-one correspondence and sustain attention through several rods. Mastery: the child counts smoothly, names quantities accurately, and can find a requested rod. Common errors: skipping segments, double-touching, losing the left-to-right direction, or mixing up number names - slow the tempo, reduce the number of rods, and re-model exact touching.",
  extensions: [
    "Build and name rods out of order (child fetches by quantity).",
    'Compare: "Which is longer/shorter?"',
    'Measure with the "one" rod: "How many ones make eight?"',
    "Simple equations with rods (compose/decompose to 10).",
  ],
  readiness:
    "Typically 4-6 years, depending on the child; prerequisite is reliable rote counting and basic one-to-one correspondence.",
};

export const SANDPAPER_NUMERALS_TEACHERS_GUIDE: MaterialTeachersGuideData = {
  title: "Sandpaper Numerals (Teacher's Guide)",
  purpose:
    "Sandpaper Numerals introduce numeral symbols through movement and touch, helping the child internalize correct formation before writing with pencil. They build muscle memory, visual discrimination, and precise numeral language. This work prepares for writing numerals and for later symbol-to-quantity materials.",
  whatsIncluded:
    "Numeral tablets (typically 0-9) with sandpaper numerals mounted on smooth boards. The rough numeral contrasts with a smooth background for clear tactile tracing.",
  keyLanguage: [
    '"This is three."',
    '"Start here."',
    '"Trace this way."',
    '"Now you try - light touch."',
    '"What is this?"',
  ],
  presentationNotes:
    "Choose 2-3 numerals and place them upright and in order. Trace each numeral slowly with two fingers while naming it once. Invite the child to trace using the same starting point and direction. Use a simple three-period sequence: name -> recognize -> recall. Best practice: minimal words, slow movement, and consistent direction every time.",
  controlOfError:
    "Tactile feedback and consistent tracing pathway help the child feel and correct direction and form.",
  observeFor:
    "Smooth, confident tracing and accurate recognition; watch for reversals, pressing too hard, or guessing - reduce the set and re-model slowly.",
  extensions: [
    "Trace then write in a sand/rice tray.",
    "Match to numeral cards.",
    '"Find me ___" around the room (labels).',
  ],
  readiness:
    "Typically 3.5-5 years; readiness includes controlled hand movement and interest in symbols.",
};

export const SPINDLE_BOXES_TEACHERS_GUIDE: MaterialTeachersGuideData = {
  title: "Spindle Boxes (Teacher's Guide)",
  purpose:
    "Spindle Boxes connect written numerals to exact quantities and strengthen one-to-one correspondence from 0-9. The child experiences that each numeral represents a fixed amount. This work clarifies zero as none and prepares for more complex quantity and symbol work.",
  whatsIncluded:
    "Two compartmented boxes labeled 0-9 and a set of loose wooden spindles (often with bands for bundling). Each compartment corresponds to one numeral.",
  keyLanguage: [
    '"This says zero. Zero means none."',
    '"Count one at a time."',
    '"Stop when you have exactly four."',
    '"Put them here."',
    '"Do we have any left?"',
  ],
  presentationNotes:
    "Lay the boxes in order and place spindles neatly to one side. Start at 1 (include 0 when appropriate), count out the exact number of spindles, and place them in the matching compartment. Move left to right steadily, counting once with deliberate movement. Best practice: emphasize exactness - count carefully and avoid repeated recounting.",
  controlOfError:
    "Extra spindles left over or empty compartments reveal counting or placement errors.",
  observeFor:
    "Accurate one-to-one counting and correct stopping; watch for double-counting, skipping numbers, or confusion about zero - slow down and reduce the range.",
  extensions: [
    '"Bring me the compartment for six."',
    "Mix: child finds where a quantity belongs.",
    "Reverse: teacher fills; child matches numerals.",
  ],
  readiness:
    "Typically 4-6 years; readiness includes stable counting to 10 and some numeral familiarity.",
};

export const NUMERALS_AND_COUNTERS_TEACHERS_GUIDE: MaterialTeachersGuideData = {
  title: "Numerals and Counters (Teacher's Guide)",
  purpose:
    "Numerals and Counters strengthen the link between numeral symbols and exact quantities while introducing odd and even through pairing. The child sees number properties visually by arranging counters in two columns. This prepares for early arithmetic thinking and pattern awareness.",
  whatsIncluded:
    "Numeral cards (usually 1-10) and a set of identical counters (chips). The child builds quantity under each numeral.",
  keyLanguage: [
    '"Put the numerals in order."',
    '"Count exactly this many."',
    '"Make pairs."',
    '"This one has no partner."',
    '"Even / Odd." (when appropriate)',
  ],
  presentationNotes:
    "Have the child lay numeral cards 1-10 in a row. Starting at 1, count counters and place them beneath each numeral in two neat vertical columns to form pairs. Keep spacing consistent so the pattern is obvious. After several numbers, point out the pairing pattern (even pairs completely; odd leaves one). Best practice: order and alignment reveal the math - keep it tidy.",
  controlOfError:
    "A mismatch between numeral and counters is visible; pairing immediately shows odd/even structure.",
  observeFor:
    "Accurate counting and organized placement; watch for messy layout, miscounts, or drifting from the two-column pattern - reset and rebuild a smaller range.",
  extensions: [
    '"Find all the even numbers."',
    "Child identifies numeral from a counter layout.",
    "Extend beyond 10 (if materials allow).",
  ],
  readiness:
    "Typically 4-6 years; readiness includes counting to 10 and basic numeral recognition.",
};

export const SHORT_BEAD_STAIR_TEACHERS_GUIDE: MaterialTeachersGuideData = {
  title: "Short Bead Stair (Teacher's Guide)",
  purpose:
    "The Short Bead Stair gives a concrete, repeatable experience of quantities 1-9 (and sometimes 10), supporting counting, comparison, and number relationships. It strengthens the internal image of quantity and prepares for composition, teens, and later operations.",
  whatsIncluded:
    "Bead bars increasing by one bead (1-9), following the standard Montessori bead color sequence. Each quantity has a distinct color/length.",
  keyLanguage: [
    '"This is five."',
    '"Let\'s count: one, two, three..."',
    '"Which is longer?"',
    '"Build seven."',
    '"How many beads?"',
  ],
  presentationNotes:
    "Build the stair in order and count each bar with steady one-to-one touch. Invite the child to rebuild independently, keeping bars aligned and in sequence. Offer only as many bars as the child can manage accurately at first. Best practice: focus on accurate quantity recognition before introducing combinations.",
  controlOfError:
    "Incorrect order or quantity stands out through graded length and consistent color-quantity pairing.",
  observeFor:
    "Fluent counting and correct identification of bars; watch for miscounts or mixing bars - reduce the set and rebuild from 1.",
  extensions: [
    "Composition: make 9 using two bars (4+5, 6+3, etc.).",
    '"Find a bar that makes ten with this one."',
    'Missing bar game: "What\'s gone?"',
  ],
  readiness:
    "Typically 4-6 years; readiness includes careful handling and reliable counting.",
};

export const TEEN_BOARD_QUANTITIES_TEACHERS_GUIDE: MaterialTeachersGuideData = {
  title: "Teen Board Quantities (Teacher's Guide)",
  purpose:
    "Teen quantities show 11-19 as ten and some more, grounding teen numbers in concrete quantity. This prevents teen confusion and builds a clear structure for teen names. It prepares for matching teen symbols and later place-value understanding.",
  whatsIncluded:
    "A ten bar and unit beads (1-9) used to build quantities from 11-19. The ten remains visible as the base unit of the set.",
  keyLanguage: [
    '"This is ten."',
    '"Ten and one is eleven."',
    '"Count: ten... eleven."',
    '"Build fourteen."',
    '"Ten and ___."',
  ],
  presentationNotes:
    "Place the ten bar, then add unit beads to make 11-19. Count forward starting from ten and name the completed quantity. Repeat with several teen quantities, inviting the child to build on request. Best practice: keep the ten bar clearly separate from the units so the structure 10 + __ stays obvious.",
  controlOfError:
    "The correct amount can be verified by counting the units added to ten.",
  observeFor:
    "Accurate building and naming of teen quantities; watch for misnaming teens or losing the count after ten - return to ten each time and slow the rhythm.",
  extensions: [
    "Teacher names a teen; child builds it.",
    'Child builds; teacher asks, "What did you make?"',
    '"Show me ten and six."',
  ],
  readiness:
    "Typically 4.5-6.5 years; readiness includes strong 1-10 quantity understanding and a clear sense of ten.",
};

export const TEEN_BOARD_SYMBOLS_TEACHERS_GUIDE: MaterialTeachersGuideData = {
  title: "Teen Board Symbols (Teacher's Guide)",
  purpose:
    "Teen Board Symbols help the child build and read the written forms of 11-19 with clarity and consistency. The child sees that teen numerals are structured (10 + 1-9), not random. This prepares for accurate reading/writing of teen numbers and later place value.",
  whatsIncluded:
    "A teen board featuring 10 and spaces/slots, plus numeral tiles/cards 1-9 used to form 11-19. The layout supports consistent formation and reading.",
  keyLanguage: [
    '"This says ten."',
    '"Ten and five is fifteen."',
    '"Read it: fifteen."',
    '"Build seventeen."',
    '"What does this say?"',
  ],
  presentationNotes:
    "Demonstrate placing a unit numeral tile to form 11-19 on the board. Build a few examples in order and read each one clearly. Invite the child to build and read independently, mixing numbers once confident. Best practice: say ten and ___ during building, then read the whole teen number.",
  controlOfError:
    "The board constrains placement; incorrect tile choice becomes clear when reading or checking sequence.",
  observeFor:
    "Correct building and fluent reading; watch for digit reversals or teen-name confusion - return to ordered practice (11->19) and pair with teen quantities as needed.",
  extensions: [
    "Teacher calls a teen; child builds it.",
    "Child builds; child brings matching quantity.",
    "Speed find/build games (calm and accurate).",
  ],
  readiness:
    "Typically 5-7 years; readiness includes strong 1-9 numeral knowledge and a clear understanding of ten.",
};

export const HUNDRED_BOARD_TEACHERS_GUIDE: MaterialTeachersGuideData = {
  title: "Hundred Board (Teacher's Guide)",
  purpose:
    "The Hundred Board helps the child internalize number sequence 1-100 and discover base-ten patterns. Building the grid strengthens counting, number order, and prediction (what comes next?). It also supports skip counting and prepares the mind for place value and later operations.",
  whatsIncluded:
    "A 10x10 grid board and number tiles 1-100 (depending on the set, either the board or the tiles provide the numerals). The work is typically built left-to-right, top-to-bottom.",
  keyLanguage: [
    '"Start with one."',
    '"What comes next?"',
    '"This row ends with ten."',
    '"The next row starts with eleven."',
    '"Find all the numbers ending in 5."',
  ],
  presentationNotes:
    "Build the first row together, placing 1-10 left to right. Continue row by row, inviting the child to predict and place the next numbers. Pause to notice patterns: each row increases by one; each new row begins ten higher. Best practice: correct orientation and steady sequence matter more than speed.",
  controlOfError:
    "Gaps, duplicates, and incorrect row starts are visible within the grid structure.",
  observeFor:
    "Fluent placement and emerging pattern recognition (tens, columns, sequences); watch for skipped numbers or incorrect row transitions - rebuild one row at a time and anchor the tens.",
  extensions: [
    "Build 1-50, then 51-100.",
    "Find 47 / 63 / 90 games.",
    "Highlight patterns: evens/odds, multiples of 5 and 10.",
    "Skip counting along the board (2s, 3s, 4s...).",
  ],
  readiness:
    "Typically 5-7 years; readiness includes stable counting beyond 20 and interest in larger sequences.",
};
