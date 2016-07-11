'use strict'
const fs = require('fs')
  , headers = ['id', 'height', 'age', 'name', 'occupation']
  , rows = 1000
  , ws = fs.createWriteStream('./data/data_big.csv')

write(headers)

for (let row = 1; row <= rows; row++) {
  const data = []
    , random = Math.floor((Math.random() + 1) * 10)

  data.push(row)
  data.push(random * 10)
  data.push(random * 5)
  data.push(rndString(random))
  data.push('2016-07-11 18:23:08')
  write(data)
}

ws.end()

function rndString(max) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    , possibleLength = possible.length
  let result = ''

  for (let i = 0; i < max; i++) {
    result += possible.charAt(Math.floor(Math.random() * possibleLength))
  }

  return result
}

function write(row) {
  ws.write(row.join(','))
  ws.write('\r\n')
}
