import React, {useState} from 'react'
import {WithStyles, withStyles} from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import Paper from '@material-ui/core/Paper'
import AddCircle from '@material-ui/icons/AddCircle'
import BookmarksIcon from '@material-ui/icons/Bookmarks'
import styles from '../../styles/weblistHeader.style'
import {redirectToIpfs} from '../../util/helpers'

export enum Extension {
  all = '',
  crypto = '.crypto',
  zil = '.zil',
  eth = '.eth',
}

interface Props extends WithStyles<typeof styles> {
  setExtension: React.Dispatch<React.SetStateAction<Extension>>
  bookMarkClick: React.Dispatch<React.SetStateAction<boolean>>
}

const WeblistHeader: React.FC<Props> = ({
  classes,
  setExtension,
  bookMarkClick,
}) => {
  const [activeButton, setActiveButton] = useState(Extension.all)

  const activate = (extension: Extension) => {
    console.log(`choosing ${extension}`)
    setActiveButton(extension)
    setExtension(extension)
  }

  const ifActive = (current: Extension): string =>
    activeButton === current ? classes.rectangle : ''
  const renderDomain = (domain: string) => {
    return (
      <Typography
        variant="body1"
        className={classes.RecordLink}
        onClick={() => 
          chrome.tabs.getCurrent(tab => {
            redirectToIpfs(`https://${domain}`, tab.id);
          })
        }
      >
        {domain}
      </Typography>
    )
  }

  const renderFeatured = () => {
    return (
      <div className={classes.featuredBox}>
        <Typography variant="h5">Featured:</Typography>
        <div className={classes.featuredBoxInner}>
          {renderDomain('myetherwallet.crypto')}
          {renderDomain('kyber.crypto')}
          {renderDomain('pomp.crypto')}
          {renderDomain('hashoshi.crypto')}
        </div>
      </div>
    )
  }
  return (
    <div className={classes.main}>
      <div className={classes.header}>
        <Typography className={classes.title} variant="h3">
          Decentralized Websites
        </Typography>
        <a href="https://unstoppabledomains.com" className={classes.link}>
          <Button className={classes.addButton}>
            <AddCircle />
            &nbsp;Launch your website
          </Button>
        </a>
      </div>
      <Paper className={classes.control}>
        <div className={classes.controlRow}>
          <div className={classes.flex}>
            <div className={ifActive(Extension.all)}>
              <Typography
                variant="subtitle1"
                className={classes.controlText}
                onClick={() => activate(Extension.all)}
              >
                All domains
              </Typography>
            </div>
            <div className={ifActive(Extension.crypto)}>
              <Typography
                variant="subtitle1"
                className={classes.controlText}
                onClick={() => activate(Extension.crypto)}
              >
                .crypto
              </Typography>
            </div>
            <div className={ifActive(Extension.zil)}>
              <Typography
                variant="subtitle1"
                className={classes.controlText}
                onClick={() => activate(Extension.zil)}
              >
                .zil
              </Typography>
            </div>
          </div>
          <div>
            <Button
              style={{color: '#4c47f7'}}
              onClick={() => bookMarkClick(true)}
            >
              <BookmarksIcon />
              &nbsp;Bookmarks
            </Button>
          </div>
        </div>
        {renderFeatured()}
      </Paper>
    </div>
  )
}
export default withStyles(styles)(WeblistHeader)
