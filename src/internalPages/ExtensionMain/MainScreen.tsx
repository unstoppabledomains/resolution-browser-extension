import React, {useEffect, useState, useCallback} from 'react'
import {
  chromeStorageSyncGet,
  chromeStorageSyncSet,
  StorageSyncKey,
} from '../../util/chromeStorageSync'
import {WithStyles, withStyles} from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import TextField from '@material-ui/core/TextField'
import styles from '../../styles/mainscreen.style'
import {ExtensionOptions, ExtensionLabel, ExtensionURIMap} from '../../types'

interface Props extends WithStyles<typeof styles> {}

const MainScreen: React.FC<Props> = ({classes}) => {
  const [gatewayBaseURL, setGatewayBaseURL] = useState(
    ExtensionURIMap[ExtensionOptions.IPFSNetwork],
  )
  const [okGatewayBaseURL, setOkGatewayBaseURL] = useState(false)
  const [showTexField, setShowTextField] = useState(false)
  const [gatewayOption, setGateWayOption] = useState<ExtensionOptions>(
    ExtensionOptions.IPFSNetwork,
  )

  useEffect(() => {
    chromeStorageSyncGet(StorageSyncKey.GatewayOption).then(option => {
      if (option === ExtensionOptions.Local) setShowTextField(true)
      setGateWayOption(option)
    })
  }, [])

  useEffect(() => {
    chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL).then(url => {
      console.log({url})
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

  useEffect(() => {
    const uri = ExtensionURIMap[gatewayOption]
    if (uri) chromeStorageSyncSet(StorageSyncKey.GatewayBaseURL, uri)
    chromeStorageSyncSet(StorageSyncKey.GatewayOption, gatewayOption)
  }, [gatewayOption])

  const handleChangeGatewayBaseURL: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    e => setGatewayBaseURL(e.target.value),
    [],
  )

  const handleChange = (
    event: React.ChangeEvent<{value: ExtensionOptions}>,
  ) => {
    const chosen: ExtensionOptions = event.target.value
    setShowTextField(chosen === ExtensionOptions.Local)
    setGateWayOption(chosen)
  }

  const renderOptions = () => {
    const items: JSX.Element[] = [];
    for (const key in ExtensionOptions) {
      const value = ExtensionOptions[key];
      items.push(<MenuItem value = {value}> {value} </MenuItem>)
    }
    return items;
  }

  const renderDropDownMenu = () => {
    return (
      <>
        <FormControl variant="filled" className={classes.formControl}>
          <InputLabel id="demo-simple-select-filled-label">
            {gatewayOption}
          </InputLabel>
          <Select
            labelId="demo-simple-select-filled-label"
            id="demo-simple-select-filled"
            placeholder="Enter your own gateway"
            value={gatewayOption}
            onChange={handleChange}
          >
            {renderOptions()}
          </Select>
        </FormControl>
        <Typography variant="body2" className={classes.gatewayMessage}>
          {ExtensionLabel[gatewayOption]}
        </Typography>
      </>
    )
  }

  const renderTextField = () => {
    if (!showTexField) return <> </>
    return (
      <div className={classes.input}>
        <Typography variant="body2" className={classes.subtitle}>
          Gateway Base URL:
        </Typography>
        <TextField
          type="text"
          id="gatewayBaseURL"
          onChange={handleChangeGatewayBaseURL}
          value={gatewayBaseURL}
          placeholder="Enter IPFS Gateway, localhost:5001"
          className={classes.inputField}
          variant="filled"
        />
      </div>
    )
  }
  return (
    <div className={classes.main}>
      <div className={classes.column}>
        <div className={classes.fields}>
          <Typography variant="body1" className={classes.title}>
            Download Files via
          </Typography>
          {renderDropDownMenu()}
          {renderTextField()}
        </div>
      </div>
    </div>
  )
}

export default withStyles(styles)(MainScreen)
