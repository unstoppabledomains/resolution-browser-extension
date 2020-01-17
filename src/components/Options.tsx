import React, {useCallback, useEffect, useState} from 'react'
import {
  chromeStorageSyncGet,
  chromeStorageSyncSet,
  StorageSyncKey,
} from '../util/chromeStorageSync'

export default () => {
  const [gatewayBaseURL, setGatewayBaseURL] = useState()
  const [okGatewayBaseURL, setOkGatewayBaseURL] = useState(false)

  useEffect(() => {
    chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL).then(url => {
      setGatewayBaseURL(url)
    })
  }, [])

  useEffect(() => {
    try {
      new URL(gatewayBaseURL.trim())
      setOkGatewayBaseURL(true)
    } catch (error) {
      try {
        new URL('http://' + gatewayBaseURL.trim())
        setOkGatewayBaseURL(true)
      } catch (error) {
        setOkGatewayBaseURL(false)
      }
    }

    if (okGatewayBaseURL) {
      chromeStorageSyncSet(
        StorageSyncKey.GatewayBaseURL,
        gatewayBaseURL.includes('://')
          ? gatewayBaseURL.trim()
          : 'http://' + gatewayBaseURL.trim(),
      )
    }
  }, [gatewayBaseURL])

  const handleChangeGatewayBaseURL: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    e => setGatewayBaseURL(e.target.value),
    [],
  )

  return (
    <div
      style={{
        padding: '.75em 1em',
        display: 'flex',
        minWidth: '400px',
        maxWidth: '600px',
        alignItems: 'center',
        fontSize: '.875rem',
      }}
    >
      <label htmlFor="gatewayBaseURL" style={{whiteSpace: 'nowrap'}}>
        Gateway Base URL:
      </label>
      <input
        type="text"
        id="gatewayBaseURL"
        onChange={handleChangeGatewayBaseURL}
        value={gatewayBaseURL}
        placeholder="Enter IPFS Gateway, localhost:5001"
        style={{
          marginLeft: '.5em',
          width: '100%',
          padding: '.5em .75em',
          fontSize: 'inherit',
          outlineColor: okGatewayBaseURL ? '#00f' : '#f00',
        }}
      />
    </div>
  )
}
