import React from 'react'

export default () => {
  return (
    <div>
      <h1 style={{padding: '.75rem 1rem'}}>How to use</h1>

      <ol style={{fontSize: '1.15rem', marginLeft: '0'}}>
        <li style={{marginTop: '.5em'}}>
          Enter a domain into the search bar. ex. findadomain.zil
        </li>
        <li style={{marginTop: '.5em'}}>
          The browser will redirect you using the gateway url below.
        </li>
        <li style={{marginTop: '.5em'}}>
          For a list of current gateways check out this{' '}
          <a href="https://ipfs.github.io/public-gateway-checker/">website</a>.
        </li>
      </ol>
    </div>
  )
}
