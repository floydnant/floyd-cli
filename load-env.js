const fs = require('fs')
const path = require('path')

const env = {
    VERSION: process.env.npm_package_version || 'x.x.x',
}

fs.writeFileSync(path.join(__dirname, 'env.json'), JSON.stringify(env, null, 4))
