const menuItems1 = [{id: 185, name: "Paneer Fried Rice"}];
const menuItems2 = [{id: 185, name: "[185] Paneer Fried Rice"}];

const clean = (str) => (str || '')
  .toLowerCase()
  .replace(/th/g, 't')
  .replace(/\s*\(\d+.*?\)/g, '')
  .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const hasWordMatch = (tStr, qStr) => {
  if (!tStr || !qStr) return false;
  const tWords = clean(tStr).split(/\s+/);
  const qWords = clean(qStr).split(/\s+/);
  return qWords.some(qw => qw.length >= 3 && tWords.some(tw => tw === qw || (tw.length >= 3 && (tw.startsWith(qw) || qw.startsWith(tw)))));
};

const findBestMenuItemMatch = (queryName, itemsList) => {
  if (!queryName || !itemsList || itemsList.length === 0) return null;
  
  let qClean = clean(queryName);
  if (!qClean) return null;

  let directMatch = itemsList.find(i =>
    clean(i.name) === qClean || (i.tamilName && clean(i.tamilName) === qClean)
  );
  if (directMatch) return directMatch;

  const qStemmed = (qClean.length > 3 && qClean.endsWith('s') && !qClean.endsWith('ss') && qClean !== 'noodles') ? qClean.slice(0, -1) : qClean;
  if (qStemmed !== qClean) {
    let stemmedMatch = itemsList.find(i =>
      clean(i.name) === qStemmed || (i.tamilName && clean(i.tamilName) === qStemmed)
    );
    if (stemmedMatch) return stemmedMatch;
  }

  let candidates = itemsList.filter(i => {
    const cName = clean(i.name);
    const cTamil = i.tamilName ? clean(i.tamilName) : '';
    return cName === qClean || cTamil === qClean || (hasWordMatch(cName, qClean) && (cName.includes(qClean) || qClean.includes(cName) || cName.includes(qStemmed) || qStemmed.includes(cName)));
  });

  if (candidates.length > 0) {
    const qHasSpl = qClean.includes('spl') || qClean.includes('special') || qClean.includes('mini');
    candidates.sort((a, b) => {
      const aClean = clean(a.name);
      const bClean = clean(b.name);
      if (aClean === qClean || aClean === qStemmed) return -1;
      if (bClean === qClean || bClean === qStemmed) return 1;
      if (!qHasSpl) {
        const aSpl = aClean.includes('spl') || aClean.includes('special') || aClean.includes('mini');
        const bSpl = bClean.includes('spl') || bClean.includes('special') || bClean.includes('mini');
        if (!aSpl && bSpl) return -1;
        if (aSpl && !bSpl) return 1;
      }
      return aClean.length - bClean.length;
    });
    return candidates[0];
  }

  let bestItem = null;
  let maxScore = 0;
  const scoreItem = (target, q) => {
    const tClean = clean(target);
    if (!tClean || !q) return 0;
    const tWords = tClean.split(' ');
    const qWords = q.split(' ');
    let matches = 0;
    qWords.forEach(qw => {
      if (tWords.some(tw => tw.includes(qw) || qw.includes(tw))) matches++;
    });
    return matches / qWords.length;
  };

  itemsList.forEach(i => {
    const score = Math.max(scoreItem(i.name, qClean), scoreItem(i.tamilName, qClean));
    if (score > maxScore) {
      maxScore = score;
      bestItem = i;
    }
  });

  if (maxScore >= 0.5) return bestItem;
  return null;
};

console.log("Match 1:", findBestMenuItemMatch("paneer fried rice", menuItems1));
console.log("Match 2:", findBestMenuItemMatch("paneer fried rice", menuItems2));
console.log("Match 3:", findBestMenuItemMatch("4 paneer fried rice.", menuItems1));
