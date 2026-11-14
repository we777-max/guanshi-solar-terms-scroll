(() => {
  'use strict';

  // Coordinates follow the original 2172 × 724 paintings. Every water patch
  // has its own inset shoreline so bridges, rocks and reeds stay motionless.
  const foreground = bank => `M${bank.map(p => p.join(' ')).join(' ')}V724H0Z`;
  const broadBanks = {
    1: [[0,617],[140,612],[270,619],[400,628],[540,625],[680,622],[810,628],[940,621],[1090,622],[1250,627],[1420,630],[1620,623],[1820,625],[2000,620],[2172,614]],
    2: [[0,612],[150,586],[285,590],[430,597],[580,598],[730,602],[900,604],[1050,605],[1220,604],[1390,605],[1530,611],[1720,618],[1880,620],[2020,610],[2172,598]],
    3: [[0,610],[150,590],[300,602],[450,605],[600,607],[770,610],[940,614],[1100,614],[1280,609],[1450,614],[1610,608],[1800,610],[1990,613],[2172,611]],
    4: [[0,613],[145,596],[300,604],[450,611],[600,610],[780,615],[920,616],[1100,610],[1260,608],[1410,611],[1570,611],[1740,612],[1910,608],[2060,609],[2172,608]],
    5: [[0,603],[170,608],[330,606],[480,613],[630,618],[790,617],[940,617],[1090,611],[1240,614],[1410,616],[1590,613],[1770,611],[1930,614],[2070,612],[2172,607]]
  };
  const winterBank = foreground([[0,601],[180,597],[360,611],[540,608],[720,620],[900,620],[1080,604],[1220,611],[1380,610],[1510,606],[1660,602],[1800,610],[1970,610],[2172,604]]);
  const ferryBank = 'M0 606L180 605 300 616 455 623 590 623 675 618 675 589 746 590 747 613 811 610 811 580 845 576 880 558 934 555 968 541 1003 530 1019 504 1048 498Q1050 464 1089 443Q1120 438 1143 466L1144 491 1190 495 1244 493Q1248 461 1274 444Q1306 438 1337 464L1339 490 1365 501 1375 525 1430 539 1470 566 1570 589 1730 610 1900 604 2070 604 2172 603V724H0Z';
  const winterOpening = 'M1583 583L1590 598 1605 604 1600 611 1623 619 1620 626 1637 635 1628 646 1634 652 1615 662 1621 671 1603 684 1608 694 1588 708 1589 724H1653L1647 706 1653 696 1648 685 1670 672 1664 663 1680 648 1673 632 1665 624 1650 620 1652 613 1632 603 1625 594 1619 583Z';
  const ferryOpening = 'M1050 445H1343V500L1360 505 1351 519 1358 525 1340 534 1349 542 1335 549 1343 558 1328 570 1336 583 1324 590 1339 602 1330 612 1341 624 1332 638 1348 647 1344 656 1358 668 1354 679 1374 690 1369 700 1388 712 1381 724H939L953 710 946 702 963 690 970 682 962 671 975 661 969 651 991 639 985 629 999 615 988 603 1004 593 995 580 1015 570 1007 560 1023 548 1017 538 1034 529 1029 518 1047 506 1048 497Z';

  const zones = {
    1: [
      { name: '上游溪水', kind: 'stream', d: 'M977 330Q1016 337 1035 348L1071 357 1085 368 1049 375 1011 361 972 352Z', paths: ['M979 340Q1022 344 1068 368'] },
      { name: '桥下汇流', kind: 'stream', d: 'M1216 430L1256 439 1281 431 1317 442 1340 446 1333 464 1307 476 1306 491 1275 504 1250 518 1211 532 1181 542 1145 551 1108 575 1062 584 1046 575 1098 547 1149 532 1176 512 1170 491 1187 471 1211 455Z', paths: ['M1254 441Q1318 449 1276 481T1191 531Q1145 542 1084 575','M1227 447Q1229 470 1200 493T1157 537L1103 562','M1308 451Q1326 461 1286 491T1225 524'] },
      { name: '水磨汇水潭', kind: 'stream', d: 'M833 531Q864 532 894 522L933 532 969 543 1008 539 1041 545 1084 538 1132 541 1107 552 1077 563 1049 577 1026 583 989 575 956 579 931 569 895 566 863 554 839 551Z', paths: ['M845 535Q920 544 965 553T1081 549','M862 546Q932 557 976 563T1049 558'] },
      { name: '水磨第一级跌水', kind: 'fall', d: 'M815 439L837 440 842 473 814 473Z', paths: ['M820 439Q825 452 821 475','M827 439Q833 455 830 475','M833 440Q839 455 838 473'] },
      { name: '水磨第二级跌水', kind: 'fall', d: 'M827 484L869 483 878 499 832 500Z', paths: ['M831 484Q839 491 838 501','M845 484Q852 492 851 500','M858 484Q868 491 866 499'] },
      { name: '水磨第三级跌水', kind: 'fall', d: 'M841 505L882 505 894 523 851 525Z', paths: ['M846 505Q858 515 856 525','M861 505Q873 514 871 525','M876 505Q887 515 887 523'] },
      { name: '桥下石坎', kind: 'rapid', d: 'M1232 453L1271 456 1293 465 1284 472 1248 464Z M1209 473L1239 475 1266 478 1249 486 1210 481Z', paths: ['M1236 454L1287 468','M1210 475L1254 483'] },
      { name: '溪口跌水', kind: 'rapid', d: 'M1004 583L1037 587 1077 583 1117 585 1134 592 1112 601 1066 599 1028 595Z', paths: ['M1011 585Q1066 600 1128 591','M1018 590Q1063 604 1110 598'] }
    ],
    2: [
      { name: '荷塘桥下水道', kind: 'stream', d: 'M1268 474Q1290 471 1316 478L1325 498 1371 519 1395 524 1409 537 1366 540 1328 528 1293 522 1270 511Z', paths: ['M1280 479Q1280 505 1329 516T1387 533','M1306 481Q1303 501 1349 523L1384 527'] }
    ],
    4: [
      { name: '秋收上游水渠', kind: 'stream', d: 'M1510 314Q1574 328 1612 359Q1644 382 1656 414L1684 414Q1672 378 1633 350Q1579 324 1525 311Z', paths: ['M1516 315Q1591 339 1626 368T1667 414'] },
      { name: '晒场桥下溪流', kind: 'stream', d: 'M1687 446Q1716 439 1752 446L1752 467 1771 481 1784 491Q1731 502 1672 501L1684 479Z', paths: ['M1697 446Q1701 466 1691 480T1704 499','M1728 446Q1724 462 1738 478L1748 495','M1740 446Q1739 461 1754 476L1767 490'] }
    ],
    5: [
      { name: '梯田弯曲水渠', kind: 'stream', d: 'M290 316Q342 329 367 347L371 363 345 381 327 390 302 400 274 412 260 422 259 439 277 454 259 457 238 442 223 425 237 411 267 398 306 389 334 377 349 364 349 352 325 339 290 327Z', paths: ['M296 322Q350 337 359 355T326 383Q280 398 250 418T266 451','M307 328Q344 338 354 354T317 385Q267 401 241 423L262 448'] },
      { name: '梯田桥下汇流', kind: 'stream', d: 'M322 482Q356 480 398 483L402 507 422 519 413 531 380 534 347 538 316 535 301 526 310 509Z', paths: ['M330 484Q332 507 317 521T363 535','M361 484L356 508Q355 522 387 531','M390 485L386 506 409 524'] },
      { name: '梯田浅坎', kind: 'rapid', d: 'M329 518L363 521 394 520 407 526 398 531 366 529 339 531 319 526Z', paths: ['M331 519Q366 531 402 525','M323 523Q353 535 393 529'] }
    ],
    6: [
      { name: '冬溪桥下活水', kind: 'winter', d: 'M1533 453Q1570 445 1603 455L1606 476 1631 491 1625 506 1575 518 1532 516 1510 507 1521 485Z M1562 550L1589 548 1624 562 1646 579 1629 585 1602 573 1583 565Z', paths: ['M1545 456Q1548 485 1537 499T1587 511','M1587 455Q1582 477 1609 494L1587 512','M1573 554Q1600 565 1636 581'] },
      { name: '冰间缓流', kind: 'winter', d: winterOpening, paths: ['M1600 584Q1606 611 1647 633T1617 691L1622 724'] }
    ],
    7: [
      { name: '古渡冰间水道', kind: 'winter', d: ferryOpening, paths: ['M1090 452Q1101 496 1071 536T1051 597Q1074 638 1049 681L1063 724','M1292 453Q1293 502 1275 532T1279 588Q1252 630 1295 677L1306 724','M1177 517Q1189 556 1151 595T1167 672L1160 724'] }
    ]
  };

  function create(panel, { element, animate }) {
    const index = Number(panel.dataset.panel);
    if (index === 0) return null;
    const svg = element('svg', { class: 'scene-motion scene-water', viewBox: '0 0 2172 724', preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false', 'data-motion-state': 'paused' });
    const defs = element('defs');
    svg.append(defs);
    const source = panel.querySelector('img').getAttribute('src');
    const wetPaths = [];
    const icePaths = [];
    let sequence = 0;
    function clip(d, name) {
      const id = `water-${index}-${name}-${sequence++}`;
      const node = element('clipPath', { id, clipPathUnits: 'userSpaceOnUse' });
      const path = element('path', { d, 'clip-rule': 'evenodd', 'fill-rule': 'evenodd' });
      node.append(path); defs.append(node);
      return { id, path };
    }
    const ferryWater = index === 7 ? clip(ferryBank, 'ferry-bank') : null;
    function waterZone(zone) {
      const area = clip(zone.d, 'wet');
      const slow = zone.kind === 'river' || zone.kind === 'winter';
      const drop = zone.kind === 'fall' || zone.kind === 'rapid';
      const duration = slow ? '11s' : drop ? '.65s' : '1.8s';
      const speed = slow ? 5 : drop ? 52 : 18;
      const group = element('g', { 'clip-path': `url(#${area.id})`, 'data-water-zone': zone.name, 'data-water-kind': zone.kind, 'data-water-speed': speed });
      const filterId = `water-${index}-displace-${sequence}`;
      const bounds = zone.kind === 'river' ? [0,580,2172,144] : ({ 1: [790,322,560,292], 2: [1250,460,175,100], 4: [1490,300,310,220], 5: [210,300,230,250], 6: [1490,438,225,286], 7: [930,435,465,289] })[index];
      const filter = element('filter', { id: filterId, x: bounds[0], y: bounds[1], width: bounds[2], height: bounds[3], filterUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' });
      const noise = element('feTurbulence', { type: 'fractalNoise', baseFrequency: slow ? '.012 .13' : '.04 .1', numOctaves: 1, seed: index * 7 + sequence, result: 'waves' });
      animate(noise, { attributeName: 'baseFrequency', values: slow ? '.012 .13;.014 .16;.012 .13' : '.04 .1;.055 .15;.04 .1', dur: slow ? '12s' : drop ? '1.3s' : '3.6s' });
      const color = element('feColorMatrix', { in: 'waves', type: 'matrix', values: '.2 0 0 0 .4  0 .8 0 0 .1  0 0 1 0 0  0 0 0 1 0', result: 'field' });
      filter.append(noise, color, element('feDisplacementMap', { in: 'SourceGraphic', in2: 'field', scale: drop ? 5 : slow ? 4 : 3, xChannelSelector: 'R', yChannelSelector: 'G' }));
      defs.append(filter);
      group.append(element('image', { href: source, width: 2172, height: 724, preserveAspectRatio: 'none', filter: `url(#${filterId})` }));
      if (zone.kind === 'river') {
        // Low, widely spaced strokes drift horizontally on the level river.
        for (let i = 0; i < 22; i += 1) {
          const x = (i * 239 + index * 73) % 2190 - 35;
          const y = 627 + (i * 37) % 89;
          const glint = element('path', { class: 'motion-current motion-current-flat', d: `M${x} ${y}q28 -2 66 0m-43 6h21`, opacity: 0 });
          const begin = `${-i * .61}s`;
          animate(glint, { attributeName: 'transform', type: 'translate', values: '0 0;55 0', dur: duration, begin }, true);
          animate(glint, { attributeName: 'opacity', values: '0;.5;.4;0', keyTimes: '0;.2;.75;1', dur: duration, begin });
          group.append(glint);
        }
      } else {
        zone.paths.forEach((d, i) => {
          const period = drop ? 34 : slow ? 55 : 32;
          const line = element('path', { class: `motion-current motion-current-${zone.kind}`, d, 'stroke-dasharray': drop ? '12 22' : slow ? '9 46' : '6 26' });
          animate(line, { attributeName: 'stroke-dashoffset', from: 0, to: -period, dur: duration, begin: `${-i * .37}s` });
          group.append(line);
        });
      }
      if (ferryWater) {
        const bankClip = element('g', { 'clip-path': `url(#${ferryWater.id})` });
        bankClip.append(group); svg.append(bankClip);
      } else svg.append(group);
      wetPaths.push(area.path);
    }
    if (broadBanks[index]) waterZone({ name: '前景平缓河面', kind: 'river', d: foreground(broadBanks[index]) });
    (zones[index] || []).forEach(waterZone);

    // Foam appears only at the foot of a real painted drop, not everywhere.
    const foamSites = index === 1 ? [[828,474,13],[854,501,23],[873,527,28],[1269,473,22],[1235,487,22],[1083,601,46]] : index === 5 ? [[370,531,31]] : [];
    foamSites.forEach(([x,y,width], i) => {
      const foam = element('g', { class: 'motion-foam', transform: `translate(${x} ${y})` });
      for (let j = 0; j < 3; j += 1) {
        const ring = element('ellipse', { cx: (j - 1) * width * .2, cy: j * 1.2, rx: width * .2, ry: 1.3, opacity: 0 });
        animate(ring, { attributeName: 'rx', values: `${width * .12};${width * .44}`, dur: '1.25s', begin: `${-j * .41 - i * .17}s` });
        animate(ring, { attributeName: 'opacity', values: '0;.65;0', keyTimes: '0;.2;1', dur: '1.25s', begin: `${-j * .41 - i * .17}s` });
        foam.append(ring);
      }
      svg.append(foam);
    });

    if (index >= 6) {
      const bank = index === 6 ? winterBank : ferryBank;
      const opening = index === 6 ? winterOpening : ferryOpening;
      const ice = clip(`${bank} ${opening}`, 'ice');
      icePaths.push(ice.path);
      const sheet = element('g', { 'clip-path': `url(#${ice.id})`, 'data-ice-surface': index === 6 ? 'winter-courtyard' : 'winter-ferry' });
      // A painted ice variant supplies paper grain, frost, trapped bubbles and
      // fractured reflections. Only water is revealed; the original land and
      // architecture remain underneath, and the ice has no animated filter.
      sheet.append(element('image', { href: `assets/motion/${index === 6 ? 'winter' : 'winter-ferry'}-ice-v1.png`, width: 2172, height: 724, preserveAspectRatio: 'none' }));
      const rim = element('path', { class: 'motion-ice-edge', d: opening });
      sheet.append(rim);
      // Intersect with the real shoreline: even-odd subtraction on its own
      // would accidentally fill the part of an opening outside the river.
      const shore = clip(bank, 'ice-shore');
      const boundedSheet = element('g', { 'clip-path': `url(#${shore.id})` });
      boundedSheet.append(sheet); svg.append(boundedSheet);
    }
    const ripples = element('g', { class: 'motion-water-ripples' });
    // Click ripples must stay in liquid water, including near a bridge or ice.
    const rippleClip = clip(wetPaths.map(path => path.getAttribute('d')).join(' '), 'ripples');
    ripples.setAttribute('clip-path', `url(#${rippleClip.id})`);
    if (ferryWater) {
      const bankClip = element('g', { 'clip-path': `url(#${ferryWater.id})` });
      bankClip.append(ripples); svg.append(bankClip);
    } else svg.append(ripples);
    panel.append(svg);
    svg.pauseAnimations();
    return {
      panel, svg, ripples,
      onWater(point) { return (!ferryWater || ferryWater.path.isPointInFill(point)) && !icePaths.some(path => path.isPointInFill(point)) && wetPaths.some(path => path.isPointInFill(point)); }
    };
  }
  window.ScrollWaterMotion = { create };
})();
