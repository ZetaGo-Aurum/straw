const fs = require('fs');

const data = JSON.parse(fs.readFileSync('next_api_dump.json', 'utf-8'));

function findKey(obj, key, path = '') {
  if (obj === null || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
        findKey(obj[i], key, `${path}[${i}]`);
    }
  } else {
    for (const k in obj) {
      if (k === key) {
        console.log(`Found ${key} at ${path}.${k} =`, JSON.stringify(obj[k]).substring(0, 100));
      }
      findKey(obj[k], key, `${path}.${k}`);
    }
  }
}

findKey(data, 'subscriberCountText');
findKey(data, 'likeCount');
findKey(data, 'likeCountWithLikeText');
findKey(data, 'description');
findKey(data, 'commentCount');
