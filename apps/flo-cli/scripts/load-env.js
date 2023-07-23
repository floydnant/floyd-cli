const fs = require('fs')
const path = require('path')

const getPackageVersion = () =>
    JSON.parse(fs.readFileSync(path.join(__dirname, '../../../package.json')).toString()).version

const env = {
    VERSION: process.env.npm_package_version ?? getPackageVersion() ?? 'x.x.x',
}

fs.writeFileSync(path.join(__dirname, '../env.json'), JSON.stringify(env, null, 4))
