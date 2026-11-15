// Build an offline, browsable asset index. No dependencies, image editing or ZIP output.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, text) => fs.writeFileSync(path.join(root, file), text);
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const exists = file => fs.existsSync(path.join(root, file));
const walk = directory => fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
  const file = `${directory}/${entry.name}`;
  return entry.isDirectory() ? walk(file) : [file];
});
const modules = [
  { id:'study', name:'书房模块', directory:'assets/study', docs:'docs/study', note:'室内背景、四册书籍和文房用具。文房用具目前仅用于试摆。', entry:'index.html' },
  { id:'scroll', name:'长卷与四季生活', directory:'assets/scroll', docs:'docs/scroll', note:'八景背景、四季道具、农事街市人物、流水、鸟虫、天气和夜景。', entry:'index.html' },
  { id:'guibiao', name:'圭表测影模块', directory:'assets/guibiao', docs:'docs/guibiao', note:'二维入口、当前三维庭院、早期独立样段，以及建模参考图。', entry:'courtyard.html' },
  { id:'placement', name:'道具试摆配置', directory:'assets/placement', docs:'docs/placement', note:'摆位数据和试摆截图；试摆界面复用前面各模块的原始素材。', entry:'placement.html' },
  { id:'references', name:'原始参考与概念稿', directory:'素材', docs:null, note:'用户提供的豳风图局部、早期立春概念画和前期清单。均不作为当前长卷底图。', entry:null }
];
const titles = {
  'watermill-clean-v1':'水磨背景：移除转轮的局部修补图', 'waterwheel-rotor-v1':'可独立转动的木水轮', 'newyear-props-v1':'年俗灯笼与爆竹透明图集',
  'interior-v1':'书房室内背景', 'books-v1':'四册古籍图集', 'stationery-v1':'文房用具：笔、墨、砚等', 'books-content':'四册古籍的摘读内容与书架位置',
  spring:'春 · 村落田园', 'spring-bridge':'春 · 溪桥水磨', summer:'夏 · 荷塘亭榭', 'summer-street':'夏 · 水乡长街', autumn:'秋 · 秋收晒场', 'autumn-terraces':'秋 · 山麓梯田', winter:'冬 · 冬日庭院', 'winter-ferry':'冬 · 古渡雪岸',
  'spring-tools-v1':'春耕农具试摆', 'harvest-v1':'秋收器具试摆', 'spring-porch-v1':'春季檐下装饰', 'summer-porch-v1':'夏季纳凉用具', 'autumn-harvest-v1':'秋季收成道具', 'winter-storage-v1':'冬藏柴薪与陶罐',
  'spring-sparrow-frames-v1':'麻雀动作图集', 'spring-duck-frames-v1':'水鸭动作图集', 'butterfly-frames-v1':'蝴蝶动作图集', 'dragonfly-frames-v1':'蜻蜓动作图集', 'spring-water-mask':'春卷流水遮罩', 'winter-ice-v1':'冬日庭院冰面图层', 'winter-ferry-ice-v1':'古渡雪岸冰面图层',
  'field-hoeing':'田间锄作', 'spring-ox-plough':'春耕牛犁', 'summer-rice-planter':'夏季插秧', 'autumn-rice-harvester':'秋季割稻', 'autumn-winnower':'禾场簸粮', 'grain-carrier':'挑担运粮', 'village-walker':'村路行人', 'market-shopper':'赶集顾客', 'market-shopkeeper':'店铺掌柜', 'winter-chopping':'冬季劈柴', 'winter-villager':'冬季抱薪行人', 'market-tea-goods-v1':'茶摊货物', 'market-cloth-goods-v1':'布铺货物', 'market-grain-goods-v1':'米铺货物',
  'gnomon-scroll-v1':'长卷中的二维圭表入口', 'guibiao-aged-v2':'当前庭院：暗青铜圭表模型', 'guibiao-aged-v2-source':'当前圭表的 Blender 源文件', 'guibiao-preview-v2':'当前圭表模型预览', 'material-atlas-v1':'庭院墙、瓦、木、石材质图集', 'gnomon-v1':'早期独立圭表模型', 'gnomon-preview':'早期圭表模型预览', 'guibiao-tripo-single-v1':'Tripo 建模斜视参考图', 'guibiao-three-views-v1':'圭表三视参考图', 'model-info':'模型尺寸与制作信息', 'placement-v1':'九个视图的道具摆位数据',
};
const runtime = [...fs.readdirSync(root).filter(file=>/\.(html|js|css)$/.test(file)), ...walk('src').filter(file=>file.endsWith('.js'))];
const sources = new Map(runtime.map(file=>[file,read(file)]));
function title(file) {
  const stem = path.basename(file, path.extname(file));
  if (titles[stem]) return titles[stem];
  if (stem.endsWith('-smokeless-v1')) return `${titles[stem.replace('-smokeless-v1','')] || stem} · 无烟覆盖图`;
  const key = stem.replace(/-v1$/, '').replace(/-lantern-rain$|-lantern$|-rain$/, '');
  if (titles[key]) return titles[key] + (stem.includes('lantern')?' · 提灯':'') + (/-rain-v1$/.test(stem)?' · 雨具':'');
  return stem;
}
function usage(file) {
  if (file.startsWith('素材/')) return '原始参考 / 前期概念，未接入主页面';
  if (file.includes('/references/')) return '建模参考，未在主页面展示';
  if (file.includes('/lab/')) return '早期独立测影样段，供对照保留';
  if (file.endsWith('.blend')) return '可编辑源模型，供 Blender 使用';
  if (file.includes('preview')) return '模型预览图';
  if (file.includes('/props/') || file.endsWith('stationery-v1.png')) return '道具试摆，尚未接入主卷 / 书房取书流程';
  if (file.endsWith('books-content.json')) return '从 study.js 自动整理的内容清单，运行时仍以 study.js 为准';
  if (file.startsWith('assets/placement/')) return '试摆配置';
  if (file.endsWith('model-info.json')) return '尺寸与制作信息';
  return '已接入当前页面';
}
function consumers(file) {
  const found = [...sources].filter(([,text])=>text.includes(file)).map(([name])=>name);
  if (file.includes('/effects/wildlife/')) found.push('motion.js','season-life.js');
  if (file.includes('/effects/seasonal/')) found.push('season-life.js');
  if (file.includes('/effects/water/')) found.push('water-motion.js');
  if (file.includes('/effects/weather/')) found.push('weather.js');
  if (file.includes('/villagers/')) found.push('rural-life.js');
  return [...new Set(found)];
}
function dimensions(file) {
  if (!file.endsWith('.png')) return {};
  const buffer=fs.readFileSync(path.join(root,file));
  return { width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20),alpha:[4,6].includes(buffer[25]) };
}
function bookContent() {
  const match=read('study.js').match(/const books = (\[[\s\S]+?\n  \]);/);
  if (!match) throw new Error('未找到 study.js 的四册书籍数据');
  return { source:'study.js / const books', note:'由素材索引脚本生成；修改书页请编辑 study.js 后重新生成。center、bounds 用于书架裁切和定位。', books:vm.runInNewContext(`(${match[1]})`,Object.create(null),{timeout:1000}) };
}
function build() {
  write('assets/study/books-content.json',JSON.stringify(bookContent(),null,2)+'\n');
  const files=modules.flatMap(module=>walk(module.directory).filter(file=>/\.(png|jpg|svg|glb|blend|json|csv)$/.test(file)).map(file=>({
    module:module.id,name:title(file),file,type:path.extname(file).slice(1).toUpperCase(),bytes:fs.statSync(path.join(root,file)).size,
    ...dimensions(file),usage:usage(file),consumers:consumers(file),sha256:sha(file)
  })));
  const catalog={version:1,date:'2026-11-15',modules:modules.map(module=>({...module,records:[...(module.docs?walk(module.docs).filter(file=>/\.(md|json)$/.test(file)):[]),...(module.id==='study'?['docs/placement/道具试摆-v1-制作记录.md']:[])],screenshots:[...(module.docs?walk(module.docs).filter(file=>file.endsWith('.jpg')):[]),...(module.id==='study'?['docs/placement/道具试摆-v1-书房.jpg']:[])]})),files};
  const json=JSON.stringify(catalog,null,2)+'\n';
  write('assets/catalog.json',json);
  write('assets/catalog.js',`// Generated by scripts/build-asset-catalog.mjs; supports file:// without fetch.\nglobalThis.SCROLL_ASSETS = ${json.trim()};\n`);
  const csvCell=value=>'"'+String(value??'').replaceAll('"','""')+'"';
  const lines=[['模块','名称','项目路径','格式','宽','高','透明通道','字节','当前用途','使用页面或脚本','SHA256'],...files.map(file=>[modules.find(module=>module.id===file.module).name,file.name,file.file,file.type,file.width,file.height,file.alpha===undefined?'':file.alpha?'有':'无',file.bytes,file.usage,file.consumers.join('；'),file.sha256])];
  write('assets/素材索引.csv','\uFEFF'+lines.map(line=>line.map(csvCell).join(',')).join('\n')+'\n');
  console.log(`已生成素材总览：${files.length} 项，${modules.length} 组；无 ZIP 输出。`);
}
function check() {
  const catalog=JSON.parse(read('assets/catalog.json'));
  const errors=[];
  for (const file of catalog.files) if(!exists(file.file)||sha(file.file)!==file.sha256)errors.push(`素材缺失或已变更，请重新生成索引：${file.file}`);
  const expected=modules.flatMap(module=>walk(module.directory).filter(file=>/\.(png|jpg|svg|glb|blend|json|csv)$/.test(file))).sort();
  if(JSON.stringify(expected)!==JSON.stringify(catalog.files.map(file=>file.file).sort()))errors.push('素材索引与文件夹内容不同步');
  if(JSON.stringify(JSON.parse(read('assets/study/books-content.json')))!==JSON.stringify(bookContent()))errors.push('书目摘读清单与 study.js 不同步');
  for (const [source,text] of sources) {
    // Validate literal runtime paths. Template paths are verified by the moved-file hashes and browser.
    const refs=[...text.matchAll(/["'`](assets\/[^"'`\s<>]+)["'`]/g)].map(match=>match[1]).filter(ref=>!ref.includes('${'));
    if(source.endsWith('.html'))refs.push(...[...text.matchAll(/(?:src|href|data-src)=["']([^"']+)["']/g)].map(match=>match[1]).filter(ref=>!/^#|^https?:|^data:/.test(ref)));
    for(const ref of refs) { const local=ref.split(/[?#]/)[0]; const resolved=local.startsWith('assets/')?local:path.posix.normalize(path.posix.join(path.posix.dirname(source),local)); if(local&&!exists(resolved))errors.push(`${source} 引用不存在：${ref}`); }
    if(/assets\/(?:motion|weather|villagers|gnomon|courtyard|props)\//.test(text))errors.push(`${source} 留有旧素材路径`);
  }
  const migration=JSON.parse(read('docs/素材归档映射.json'));
  for(const file of migration.files)if(/\.(png|jpg|svg|glb|blend)$/.test(file.after)&&(!exists(file.after)||sha(file.after)!==file.sha256Before))errors.push(`归档前后素材内容不一致：${file.after}`);
  for(const module of catalog.modules)for(const file of [...module.records,...module.screenshots])if(!exists(file))errors.push(`记录缺失：${file}`);
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`素材检查通过：${catalog.files.length} 项文件、页面静态引用、书籍内容及归档前后的图像/模型哈希一致。`);
}
if(process.argv.includes('--check')) check(); else {build();check();}
