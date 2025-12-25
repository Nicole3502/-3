export enum AppState {
  TREE = 'TREE',
  EXPLODE = 'EXPLODE',
}

export enum GestureType {
  NONE = 'NONE',
  PINCH = 'PINCH',       // Fist/Pinch -> Tree
  OPEN = 'OPEN',         // Open Hand -> Explode
  DOUBLE_PINCH = 'DOUBLE_PINCH' // Thumb+Index -> Card
}

export const GOLD_PALETTE = [
  '#FFD700', // Gold
  '#D0DDB6', // Pale Gold/Greenish
  '#C4B960', // Darker Gold
  '#F5E6C4', // Champagne
  '#FFFFFF'  // White highlight
];

export const BLESSINGS = [
  "圣诞快乐,MERRY CHRISTMAS",
  "马上好运气,GOOD LUCK SOON",
  "暴富,GET RICH",
  "人生海海,尽兴开怀",
  "一切尽意,百事从欢",
  "执着于理想,纯粹于当下",
  "所愿即所得,WISH GRANTED",
  "平安喜乐,PEACE AND JOY",
  "发财,被爱,好运常在",
  "来年顶峰相见,SEE YOU AT THE TOP",
  "所愿皆所成,DREAMS COME TRUE",
  "未来可期,一切值得",
  "自由且快乐,FREE AND HAPPY"
];
