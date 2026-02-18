export type InitialSoundSlide = {
  word: string;
  image: string;
};

export type InitialSoundGroup = {
  slug: string;
  label: string;
  letters: string[];
  color: string;
  slides: InitialSoundSlide[];
};

const A_SLIDES: InitialSoundSlide[] = [
  { word: "alligator", image: "/assets/language_arts/initial_sound/Initial Sound - A/a---alligator___initial_sound-20260209_185322-1.png" },
  { word: "ambulance", image: "/assets/language_arts/initial_sound/Initial Sound - A/a---ambulance___initial_sound-20260209_185755-1.png" },
  { word: "anchor", image: "/assets/language_arts/initial_sound/Initial Sound - A/a---anchor___initial_sound-20260209_185538-1.png" },
  { word: "ant", image: "/assets/language_arts/initial_sound/Initial Sound - A/a---ant___initial_sound-20260209_185104-1.png" },
  { word: "apple", image: "/assets/language_arts/initial_sound/Initial Sound - A/a---apple___initial_sound-20260209_184849-1.png" },
  { word: "astronaut", image: "/assets/language_arts/initial_sound/Initial Sound - A/a---astronaut___initial_sound-20260209_190014-1.png" },
];

const E_SLIDES: InitialSoundSlide[] = [
  { word: "egg", image: "/assets/language_arts/initial_sound/Initial sound - E/e---egg___initial_sound-20260209_203627-1.png" },
  { word: "elbow", image: "/assets/language_arts/initial_sound/Initial sound - E/e---elbow___initial_sound-20260209_204110-1.png" },
  { word: "elephant", image: "/assets/language_arts/initial_sound/Initial sound - E/e---elephant___initial_sound-20260209_203844-1.png" },
  { word: "elf", image: "/assets/language_arts/initial_sound/Initial sound - E/e---elf___initial_sound-20260209_204811-1.png" },
  { word: "engine", image: "/assets/language_arts/initial_sound/Initial sound - E/e---engine___initial_sound-20260209_204334-1.png" },
  { word: "envelope", image: "/assets/language_arts/initial_sound/Initial sound - E/e---envelope___initial_sound-20260209_204553-1.png" },
];

const D_SLIDES: InitialSoundSlide[] = [
  { word: "dice", image: "/assets/language_arts/initial_sound/Initial Sound - D/d---dice___initial_sound-20260209_202540-1.png" },
  { word: "dog", image: "/assets/language_arts/initial_sound/Initial Sound - D/d---dog___initial_sound-20260209_201013-1.png" },
  { word: "doll", image: "/assets/language_arts/initial_sound/Initial Sound - D/d---doll___initial_sound-20260209_201809-1.png" },
  { word: "donut", image: "/assets/language_arts/initial_sound/Initial Sound - D/d---donut___initial_sound-20260209_202315-1.png" },
  { word: "door", image: "/assets/language_arts/initial_sound/Initial Sound - D/d---door___initial_sound-20260209_201449-1.png" },
  { word: "duck", image: "/assets/language_arts/initial_sound/Initial Sound - D/d---duck___initial_sound-20260209_201231-1.png" },
];

const F_SLIDES: InitialSoundSlide[] = [
  { word: "fan", image: "/assets/language_arts/initial_sound/Initial Sound - F/f---fan___initial_sound.png" },
  { word: "feather", image: "/assets/language_arts/initial_sound/Initial Sound - F/f---feather___initial_sound.png" },
  { word: "feet", image: "/assets/language_arts/initial_sound/Initial Sound - F/f---feet___initial_sound.png" },
  { word: "fish", image: "/assets/language_arts/initial_sound/Initial Sound - F/f---fish___initial_sound.png" },
  { word: "fork", image: "/assets/language_arts/initial_sound/Initial Sound - F/f---fork___initial_sound.png" },
  { word: "fox", image: "/assets/language_arts/initial_sound/Initial Sound - F/f---fox___initial_sound.png" },
];

const R_SLIDES: InitialSoundSlide[] = [
  { word: "rabbit", image: "/assets/language_arts/initial_sound/Initial Sound - R/r---rabbit___initial_sound.png" },
  { word: "rainbow", image: "/assets/language_arts/initial_sound/Initial Sound - R/r---rainbow___initial_sound.png" },
  { word: "ring", image: "/assets/language_arts/initial_sound/Initial Sound - R/r---ring___initial_sound.png" },
  { word: "robot", image: "/assets/language_arts/initial_sound/Initial Sound - R/r---robot___initial_sound.png" },
  { word: "rooster", image: "/assets/language_arts/initial_sound/Initial Sound - R/r---rooster___initial_sound.png" },
  { word: "rope", image: "/assets/language_arts/initial_sound/Initial Sound - R/r---rope___initial_sound.png" },
];

const S_SLIDES: InitialSoundSlide[] = [
  { word: "sandwich", image: "/assets/language_arts/initial_sound/Initial Sound - S/s---sandwich___initial_sound.png" },
  { word: "seal", image: "/assets/language_arts/initial_sound/Initial Sound - S/s---seal___initial_sound.png" },
  { word: "six", image: "/assets/language_arts/initial_sound/Initial Sound - S/s---six___initial_sound.png" },
  { word: "soap", image: "/assets/language_arts/initial_sound/Initial Sound - S/s---soap___initial_sound.png" },
  { word: "sock", image: "/assets/language_arts/initial_sound/Initial Sound - S/s---sock___initial_sound.png" },
  { word: "sun", image: "/assets/language_arts/initial_sound/Initial Sound - S/s---sun___initial_sound.png" },
];

const I_SLIDES: InitialSoundSlide[] = [
  { word: "igloo", image: "/assets/language_arts/initial_sound/Initial Sound - I/i---igloo___initial_sound.png" },
  { word: "iguana", image: "/assets/language_arts/initial_sound/Initial Sound - I/i---iguana___initial_sound.png" },
  { word: "inch", image: "/assets/language_arts/initial_sound/Initial Sound - I/i---inch___initial_sound.png" },
  { word: "ink", image: "/assets/language_arts/initial_sound/Initial Sound - I/i---ink___initial_sound.png" },
  { word: "insect", image: "/assets/language_arts/initial_sound/Initial Sound - I/i---insect___initial_sound.png" },
  { word: "instrument", image: "/assets/language_arts/initial_sound/Initial Sound - I/i---instrument___initial_sound.png" },
];

const B_SLIDES: InitialSoundSlide[] = [
  { word: "ball", image: "/assets/language_arts/initial_sound/Initial Sound - B/b---ball___initial_sound-20260209_190354-1.png" },
  { word: "banana", image: "/assets/language_arts/initial_sound/Initial Sound - B/b---banana___initial_sound-20260209_190829-1.png" },
  { word: "bed", image: "/assets/language_arts/initial_sound/Initial Sound - B/b---bed___initial_sound-20260209_191048-1.png" },
  { word: "bird", image: "/assets/language_arts/initial_sound/Initial Sound - B/b---bird___initial_sound-20260209_191303-1.png" },
  { word: "bus", image: "/assets/language_arts/initial_sound/Initial Sound - B/b---bus___initial_sound-20260209_191524-1.png" },
];

const C_SLIDES: InitialSoundSlide[] = [
  { word: "cake", image: "/assets/language_arts/initial_sound/Initial Sound - C/c---cake___initial_sound-20260209_194845-1.png" },
  { word: "car", image: "/assets/language_arts/initial_sound/Initial Sound - C/c---car___initial_sound-20260209_193511-1.png" },
  { word: "cat", image: "/assets/language_arts/initial_sound/Initial Sound - C/c---cat___initial_sound-20260209_193035-1.png" },
  { word: "corn", image: "/assets/language_arts/initial_sound/Initial Sound - C/c---corn___initial_sound-20260209_195100-1.png" },
  { word: "cow", image: "/assets/language_arts/initial_sound/Initial Sound - C/c---cow___initial_sound-20260209_194414-1.png" },
  { word: "cup", image: "/assets/language_arts/initial_sound/Initial Sound - C/c---cup___initial_sound-20260209_193254-1.png" },
];

const H_SLIDES: InitialSoundSlide[] = [
  { word: "hammer", image: "/assets/language_arts/initial_sound/Initial Sound - H/h---hammer___initial_sound.png" },
  { word: "hand", image: "/assets/language_arts/initial_sound/Initial Sound - H/h---hand___initial_sound.png" },
  { word: "hat", image: "/assets/language_arts/initial_sound/Initial Sound - H/h---hat___initial_sound.png" },
  { word: "heart", image: "/assets/language_arts/initial_sound/Initial Sound - H/h---heart___initial_sound.png" },
  { word: "hen", image: "/assets/language_arts/initial_sound/Initial Sound - H/h---hen___initial_sound.png" },
  { word: "house", image: "/assets/language_arts/initial_sound/Initial Sound - H/h---house___initial_sound.png" },
];

const L_SLIDES: InitialSoundSlide[] = [
  { word: "ladder", image: "/assets/language_arts/initial_sound/Initial Sound - L/l---ladder___initial_sound.png" },
  { word: "lamp", image: "/assets/language_arts/initial_sound/Initial Sound - L/l---lamp___initial_sound.png" },
  { word: "leaf", image: "/assets/language_arts/initial_sound/Initial Sound - L/l---leaf___initial_sound.png" },
  { word: "leg", image: "/assets/language_arts/initial_sound/Initial Sound - L/l---leg___initial_sound.png" },
  { word: "lemon", image: "/assets/language_arts/initial_sound/Initial Sound - L/l---lemon___initial_sound.png" },
  { word: "lion", image: "/assets/language_arts/initial_sound/Initial Sound - L/l---lion___initial_sound.png" },
];


const M_SLIDES: InitialSoundSlide[] = [
  { word: "map", image: "/assets/language_arts/initial_sound/Initial Sound - M/m---map___initial_sound.png" },
  { word: "milk", image: "/assets/language_arts/initial_sound/Initial Sound - M/m---milk___initial_sound.png" },
  { word: "mix", image: "/assets/language_arts/initial_sound/Initial Sound - M/m---mix___initial_sound.png" },
  { word: "monkey", image: "/assets/language_arts/initial_sound/Initial Sound - M/m---monkey___initial_sound.png" },
  { word: "moon", image: "/assets/language_arts/initial_sound/Initial Sound - M/m---moon___initial_sound.png" },
  { word: "mouse", image: "/assets/language_arts/initial_sound/Initial Sound - M/m---mouse___initial_sound.png" },
  { word: "muffin", image: "/assets/language_arts/initial_sound/Initial Sound - M/m---muffin___initial_sound.png" },
];

const N_SLIDES: InitialSoundSlide[] = [
  { word: "nail", image: "/assets/language_arts/initial_sound/Initial Sound - N/n---nail___initial_sound.png" },
  { word: "nest", image: "/assets/language_arts/initial_sound/Initial Sound - N/n---nest___initial_sound.png" },
  { word: "net", image: "/assets/language_arts/initial_sound/Initial Sound - N/n---net___initial_sound.png" },
  { word: "noodles", image: "/assets/language_arts/initial_sound/Initial Sound - N/n---noodles___initial_sound.png" },
  { word: "nose", image: "/assets/language_arts/initial_sound/Initial Sound - N/n---nose___initial_sound.png" },
  { word: "nut", image: "/assets/language_arts/initial_sound/Initial Sound - N/n---nut___initial_sound.png" },
];

const O_SLIDES: InitialSoundSlide[] = [
  { word: "octagon", image: "/assets/language_arts/initial_sound/Initial Sound - O/o---octagon___initial_sound.png" },
  { word: "octopus", image: "/assets/language_arts/initial_sound/Initial Sound - O/o---octopus___initial_sound.png" },
  { word: "olive", image: "/assets/language_arts/initial_sound/Initial Sound - O/o---olive___initial_sound.png" },
  { word: "ostrich", image: "/assets/language_arts/initial_sound/Initial Sound - O/o---ostrich___initial_sound.png" },
  { word: "otter", image: "/assets/language_arts/initial_sound/Initial Sound - O/o---otter___initial_sound.png" },
  { word: "ox", image: "/assets/language_arts/initial_sound/Initial Sound - O/o---ox___initial_sound.png" },
];


const P_SLIDES: InitialSoundSlide[] = [
  { word: "pan", image: "/assets/language_arts/initial_sound/Initial Sound - P/p---pan___initial_sound.png" },
  { word: "pencil", image: "/assets/language_arts/initial_sound/Initial Sound - P/p---pencil___initial_sound.png" },
  { word: "penguin", image: "/assets/language_arts/initial_sound/Initial Sound - P/p---penguin___initial_sound.png" },
  { word: "pig", image: "/assets/language_arts/initial_sound/Initial Sound - P/p---pig___initial_sound.png" },
  { word: "pizza", image: "/assets/language_arts/initial_sound/Initial Sound - P/p---pizza___initial_sound.png" },
  { word: "pumpkin", image: "/assets/language_arts/initial_sound/Initial Sound - P/p---pumpkin___initial_sound.png" },
];

const T_SLIDES: InitialSoundSlide[] = [
  { word: "table", image: "/assets/language_arts/initial_sound/Initial Sound - T/t---table___initial_sound.png" },
  { word: "tent", image: "/assets/language_arts/initial_sound/Initial Sound - T/t---tent___initial_sound.png" },
  { word: "tiger", image: "/assets/language_arts/initial_sound/Initial Sound - T/t---tiger___initial_sound.png" },
  { word: "tooth", image: "/assets/language_arts/initial_sound/Initial Sound - T/t---tooth___initial_sound.png" },
  { word: "top", image: "/assets/language_arts/initial_sound/Initial Sound - T/t---top___initial_sound.png" },
  { word: "turtle", image: "/assets/language_arts/initial_sound/Initial Sound - T/t---turtle___initial_sound.png" },
];

const G_SLIDES: InitialSoundSlide[] = [
  { word: "garden", image: "/assets/language_arts/initial_sound/Initial Sound - G/g---garden___initial_sound.png" },
  { word: "gate", image: "/assets/language_arts/initial_sound/Initial Sound - G/g---gate___initial_sound.png" },
  { word: "gift", image: "/assets/language_arts/initial_sound/Initial Sound - G/g---gift___initial_sound.png" },
  { word: "goat", image: "/assets/language_arts/initial_sound/Initial Sound - G/g---goat___initial_sound.png" },
  { word: "goose", image: "/assets/language_arts/initial_sound/Initial Sound - G/g---goose___initial_sound.png" },
  { word: "gum", image: "/assets/language_arts/initial_sound/Initial Sound - G/g---gum___initial_sound.png" },
];

const J_SLIDES: InitialSoundSlide[] = [
  { word: "jacket", image: "/assets/language_arts/initial_sound/Initial Sound - J/j---jacket___initial_sound.png" },
  { word: "jam", image: "/assets/language_arts/initial_sound/Initial Sound - J/j---jam___initial_sound.png" },
  { word: "jar", image: "/assets/language_arts/initial_sound/Initial Sound - J/j---jar___initial_sound.png" },
  { word: "jelly", image: "/assets/language_arts/initial_sound/Initial Sound - J/j---jelly___initial_sound.png" },
  { word: "jet", image: "/assets/language_arts/initial_sound/Initial Sound - J/j---jet___initial_sound.png" },
  { word: "juice", image: "/assets/language_arts/initial_sound/Initial Sound - J/j---juice___initial_sound.png" },
];

const K_SLIDES: InitialSoundSlide[] = [
  { word: "kangaroo", image: "/assets/language_arts/initial_sound/Initial Sound - K/k---kangaroo___initial_sound.png" },
  { word: "kettle", image: "/assets/language_arts/initial_sound/Initial Sound - K/k---kettle___initial_sound.png" },
  { word: "key", image: "/assets/language_arts/initial_sound/Initial Sound - K/k---key___initial_sound.png" },
  { word: "kite", image: "/assets/language_arts/initial_sound/Initial Sound - K/k---kite___initial_sound.png" },
  { word: "kitten", image: "/assets/language_arts/initial_sound/Initial Sound - K/k---kitten___initial_sound.png" },
  { word: "koala", image: "/assets/language_arts/initial_sound/Initial Sound - K/k---koala___initial_sound.png" },
];

const W_SLIDES: InitialSoundSlide[] = [
  { word: "wagon", image: "/assets/language_arts/initial_sound/Initial Sound - W/w---wagon___initial_sound.png" },
  { word: "water", image: "/assets/language_arts/initial_sound/Initial Sound - W/w---water___initial_sound.png" },
  { word: "web", image: "/assets/language_arts/initial_sound/Initial Sound - W/w---web___initial_sound.png" },
  { word: "whale", image: "/assets/language_arts/initial_sound/Initial Sound - W/w---whale___initial_sound.png" },
  { word: "window", image: "/assets/language_arts/initial_sound/Initial Sound - W/w---window___initial_sound.png" },
  { word: "worm", image: "/assets/language_arts/initial_sound/Initial Sound - W/w---worm___initial_sound.png" },
];

const U_SLIDES: InitialSoundSlide[] = [
  { word: "umbrella", image: "/assets/language_arts/initial_sound/Initial Sound - U/u---umbrella___initial_sound.png" },
  { word: "umpire", image: "/assets/language_arts/initial_sound/Initial Sound - U/u---umpire___initial_sound.png" },
  { word: "uncle", image: "/assets/language_arts/initial_sound/Initial Sound - U/u---uncle___initial_sound.png" },
  { word: "under", image: "/assets/language_arts/initial_sound/Initial Sound - U/u---under___initial_sound.png" },
  { word: "underwear", image: "/assets/language_arts/initial_sound/Initial Sound - U/u---underwear___initial_sound.png" },
  { word: "up", image: "/assets/language_arts/initial_sound/Initial Sound - U/u---up___initial_sound.png" },
];

const QU_SLIDES: InitialSoundSlide[] = [
  { word: "quail", image: "/assets/language_arts/initial_sound/Initial Sound - Q/q---quail___initial_sound.png" },
  { word: "quarter", image: "/assets/language_arts/initial_sound/Initial Sound - Q/q---quarter___initial_sound.png" },
  { word: "queen", image: "/assets/language_arts/initial_sound/Initial Sound - Q/q---queen___initial_sound.png" },
  { word: "quill", image: "/assets/language_arts/initial_sound/Initial Sound - Q/q---quill___initial_sound.png" },
  { word: "quilt", image: "/assets/language_arts/initial_sound/Initial Sound - Q/q---quilt___initial_sound.png" },
];

const V_SLIDES: InitialSoundSlide[] = [
  { word: "vacuum", image: "/assets/language_arts/initial_sound/Initial Sound - V/v---vacuum___initial_sound.png" },
  { word: "van", image: "/assets/language_arts/initial_sound/Initial Sound - V/v---van___initial_sound.png" },
  { word: "vase", image: "/assets/language_arts/initial_sound/Initial Sound - V/v---vase___initial_sound.png" },
  { word: "vest", image: "/assets/language_arts/initial_sound/Initial Sound - V/v---vest___initial_sound.png" },
  { word: "violin", image: "/assets/language_arts/initial_sound/Initial Sound - V/v---violin___initial_sound.png" },
  { word: "volcano", image: "/assets/language_arts/initial_sound/Initial Sound - V/v---volcano___initial_sound.png" },
];

const Y_SLIDES: InitialSoundSlide[] = [
  { word: "yak", image: "/assets/language_arts/initial_sound/Initial Sound - Y/y---yak___initial_sound.png" },
  { word: "yarn", image: "/assets/language_arts/initial_sound/Initial Sound - Y/y---yarn___initial_sound.png" },
  { word: "yawn", image: "/assets/language_arts/initial_sound/Initial Sound - Y/y---yawn___initial_sound.png" },
  { word: "yellow", image: "/assets/language_arts/initial_sound/Initial Sound - Y/y---yellow___initial_sound.png" },
  { word: "yo-yo", image: "/assets/language_arts/initial_sound/Initial Sound - Y/y---yo-yo___initial_sound.png" },
  { word: "yogurt", image: "/assets/language_arts/initial_sound/Initial Sound - Y/y---yogurt___initial_sound.png" },
];

const Z_SLIDES: InitialSoundSlide[] = [
  { word: "zebra", image: "/assets/language_arts/initial_sound/Initial Sound - Z/z---zebra___initial_sound.png" },
  { word: "zero", image: "/assets/language_arts/initial_sound/Initial Sound - Z/z---zero___initial_sound.png" },
  { word: "zigzag", image: "/assets/language_arts/initial_sound/Initial Sound - Z/z---zigzag___initial_sound.png" },
  { word: "zipper", image: "/assets/language_arts/initial_sound/Initial Sound - Z/z---zipper___initial_sound.png" },
  { word: "zoo", image: "/assets/language_arts/initial_sound/Initial Sound - Z/z---zoo___initial_sound.png" },
  { word: "zucchini", image: "/assets/language_arts/initial_sound/Initial Sound - Z/z---zucchini___initial_sound.png" },
];

export const initialSoundGroups: InitialSoundGroup[] = [
  {
    slug: "a-m-n-p-t",
    label: "Group 1",
    letters: ["a", "m", "n", "p", "t"],
    color: "#d62828", // red
    slides: [...A_SLIDES, ...M_SLIDES, ...N_SLIDES, ...P_SLIDES, ...T_SLIDES],
  },
  {
    slug: "e-d-f-r-s",
    label: "Group 2",
    letters: ["e", "d", "f", "r", "s"],
    color: "#2054d9",
    slides: [...E_SLIDES, ...D_SLIDES, ...F_SLIDES, ...R_SLIDES, ...S_SLIDES],
  },
  {
    slug: "i-b-c-h-l",
    label: "Group 3",
    letters: ["i", "b", "c", "h", "l"],
    color: "#f4c534",
    slides: [...I_SLIDES, ...B_SLIDES, ...C_SLIDES, ...H_SLIDES, ...L_SLIDES],
  },
  {
    slug: "o-g-j-k-w",
    label: "Group 4",
    letters: ["o", "g", "j", "k", "w"],
    color: "#2bb673",
    slides: [...O_SLIDES, ...G_SLIDES, ...J_SLIDES, ...K_SLIDES, ...W_SLIDES],
  },
  {
    slug: "u-qu-v-x-y-z",
    label: "Group 5",
    letters: ["u", "qu", "v", "x", "y", "z"],
    color: "#f07d1a",
    slides: [...U_SLIDES, ...QU_SLIDES, ...V_SLIDES, ...Y_SLIDES, ...Z_SLIDES],
  },
];
