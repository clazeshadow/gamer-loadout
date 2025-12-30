const fs = require('fs')
const path = require('path')

function ok(msg){
  console.log('ok:', msg)
  process.exit(0)
}

function fail(msg){
  console.error('fail:', msg)
  process.exit(2)
}

const publicIndex = path.join(__dirname, '..', 'public', 'index.html')
if (!fs.existsSync(publicIndex)) {
  fail('public/index.html not found')
}

ok('public/index.html exists')
