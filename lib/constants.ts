// lib/constants.ts — shared constants used across components
import type { Weather, Scene } from './types';

export const QUOTES = [
  { text: '你也走了很远的路吧，辛苦了。', source: '卢思浩《你也走了很远的路吧》' },
  { text: '我们都是在夜里崩溃过的旅人。', source: '卢思浩《你也走了很远的路吧》' },
  { text: '愿有人陪你颠沛流离，如果没有，愿你成为自己的太阳。', source: '卢思浩' },
  { text: '时间带走的，也会以另一种方式还给你。', source: '卢思浩《你也走了很远的路吧》' },
  { text: '这世界太吵闹，你要把自己照顾好。', source: '卢思浩' },
  { text: '人生就是一场又一场的相遇与告别。', source: '卢思浩《你也走了很远的路吧》' },
  { text: '成长就是学会一个人消化所有情绪。', source: '卢思浩' },
  { text: '我们终将独自长大。', source: '卢思浩《你也走了很远的路吧》' },
  { text: '山有顶峰，湖有彼岸，在人生漫漫长途中，万物皆有回转。', source: '《你好生活》' },
  { text: '人生海海，山山而川，不过尔尔。', source: '麦家《人生海海》' },
  { text: '一个人要像一支队伍。', source: '刘瑜' },
  { text: '万物皆有裂痕，那是光照进来的地方。', source: '莱昂纳德·科恩' },
  { text: '且视他人之疑目如盏盏鬼火，大胆去走你的夜路。', source: '史铁生' },
  { text: '落在一个人一生中的雪，我们不能全部看见。', source: '刘亮程《一个人的村庄》' },
  { text: '活着就是冲天一喊。', source: '陈年喜' },
  { text: '世界上只有一种英雄主义，就是看清生活的真相后依然热爱它。', source: '罗曼·罗兰' },
  { text: '不必太纠结于当下，也不必太忧虑未来。', source: '村上春树' },
  { text: '春天是破晓的时候最好，夏天是夜里最好。', source: '清少纳言《枕草子》' },
  { text: '人生如逆旅，我亦是行人。', source: '苏轼' },
  { text: '此心安处是吾乡。', source: '苏轼' },
  { text: '人间有味是清欢。', source: '苏轼' },
  { text: '满地都是六便士，他却抬头看见了月亮。', source: '毛姆《月亮与六便士》' },
  { text: '每一个不曾起舞的日子，都是对生命的辜负。', source: '尼采' },
  { text: '生如夏花之绚烂，死如秋叶之静美。', source: '泰戈尔' },
  { text: '天空不留下鸟的痕迹，但我已飞过。', source: '泰戈尔' },
  { text: '当你为错过太阳而哭泣时，你也要错过群星了。', source: '泰戈尔' },
  { text: '我们读诗、写诗，不是因为它好玩，而是因为我们是人类的一份子。', source: '《死亡诗社》' },
  { text: '不要温和地走进那个良夜。', source: '狄兰·托马斯' },
  { text: '有些人能感受到雨，而其他人只是被淋湿。', source: '鲍勃·迪伦' },
  { text: '真正的旅行不在于寻找新的风景，而在于拥有新的眼睛。', source: '普鲁斯特' },
];

export const WEATHERS: { value: Weather; label: string; emoji: string }[] = [
  { value: 'sunny', label: '晴', emoji: '☀️' },
  { value: 'cloudy', label: '多云', emoji: '☁️' },
  { value: 'light-rain', label: '小雨', emoji: '🌧' },
  { value: 'heavy-rain', label: '大雨', emoji: '⛈' },
  { value: 'fog', label: '雾', emoji: '🌫' },
  { value: 'snow', label: '雪', emoji: '❄️' },
];

export const SCENES: { value: Scene; label: string; icon: string }[] = [
  { value: 'autumn-bench', label: '秋日长椅', icon: '🍂' },
  { value: 'darkroom', label: '旧房间', icon: '📷' },
  { value: 'starlit-camp', label: '星空营地', icon: '✨' },
  { value: 'lighthouse-coast', label: '海边灯塔', icon: '🗼' },
  { value: 'bookstore', label: '深夜书店', icon: '📚' },
];
