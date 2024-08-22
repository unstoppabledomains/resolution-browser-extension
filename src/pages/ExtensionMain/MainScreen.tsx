import React, {useEffect, useState, useCallback} from "react";
import {
  chromeStorageSyncGet,
  chromeStorageSyncSet,
  StorageSyncKey,
} from "../../lib/chromeStorageSync";
import {
  ExtensionOptions,
  ExtensionLabel,
  ExtensionURIMap,
} from "../../types/redirect";
import OAURL from "../../lib/OsAgnosticURL";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import ShowUserId from "../../components/ShowUserId";
import {useFlags} from "launchdarkly-react-client-sdk";

const styles = {
  main: {
    height: "100%",
    width: "100%",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
  },
  title: {
    fontWeight: "bold",
    fontSize: "18px",
  },
  subtitle: {
    fontSize: "14px",
    fontWeight: 600,
  },
  formControl: {
    margin: 0,
    padding: 0,
    height: "48px",
    maxHeight: "48px",
  },
  selectEmpty: {
    marginTop: 0,
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
  },
  input: {
    marginTop: 3,
  },
  inputField: {
    width: "100%",
  },
  spacer: {
    display: "flex",
    width: "100%",
    minHeight: "100%",
  },
  gatewayMessage: {
    marginTop: 1,
    color: "#939799",
  },
};

interface Props {
  hideUserId?: boolean;
}

const MainScreen: React.FC<Props> = ({hideUserId}) => {
  const flags = useFlags();
  const showUserId = !hideUserId && flags.extensionShowUserid;

  const [gatewayBaseURL, setGatewayBaseURL] = useState(
    ExtensionURIMap[ExtensionOptions.InfuraAPI] as string,
  );
  const [okGatewayBaseURL, setOkGatewayBaseURL] = useState(false);
  const [showTexField, setShowTextField] = useState(false);
  const [gatewayOption, setGateWayOption] = useState<string>(
    ExtensionOptions.InfuraAPI,
  );

  useEffect(() => {
    chromeStorageSyncGet(StorageSyncKey.GatewayOption).then((option) => {
      if (option === ExtensionOptions.InfuraAPI) setShowTextField(true);
      setGateWayOption(option);
    });
  }, []);

  useEffect(() => {
    chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL).then((url) => {
      setGatewayBaseURL(url);
    });
  }, []);

  useEffect(() => {
    try {
      new OAURL(gatewayBaseURL.trim());
      setOkGatewayBaseURL(true);
    } catch (error) {
      try {
        new OAURL("http://" + gatewayBaseURL.trim());
        setOkGatewayBaseURL(true);
      } catch (error) {
        setOkGatewayBaseURL(false);
      }
    }

    if (okGatewayBaseURL) {
      chromeStorageSyncSet(
        StorageSyncKey.GatewayBaseURL,
        gatewayBaseURL.includes("://")
          ? gatewayBaseURL.trim()
          : "http://" + gatewayBaseURL.trim(),
      );
    }
  }, [gatewayBaseURL]);

  useEffect(() => {
    const uri = ExtensionURIMap[gatewayOption];
    if (uri) chromeStorageSyncSet(StorageSyncKey.GatewayBaseURL, uri);
    chromeStorageSyncSet(StorageSyncKey.GatewayOption, gatewayOption);
  }, [gatewayOption]);

  const handleChangeGatewayBaseURL: React.ChangeEventHandler<HTMLInputElement> =
    useCallback((e) => setGatewayBaseURL(e.target.value), []);

  const handleChange = (event: SelectChangeEvent<ExtensionOptions>) => {
    const chosen = event.target.value;
    setShowTextField(chosen === ExtensionOptions.InfuraAPI);
    setGateWayOption(chosen);
  };

  const renderOptions = () => {
    const items: JSX.Element[] = [];
    for (const key in ExtensionOptions) {
      const value = ExtensionOptions[key];
      items.push(
        <MenuItem key={key} value={value}>
          {" "}
          {value}{" "}
        </MenuItem>,
      );
    }
    return items;
  };

  const renderDropDownMenu = () => {
    return (
      <>
        <FormControl variant="filled" sx={styles.formControl}>
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
        <Typography variant="body2" sx={styles.gatewayMessage}>
          {ExtensionLabel[gatewayOption]}
        </Typography>
      </>
    );
  };

  const renderHint = () => {
    return (
      <Typography>{"Place {ipfs} where the ipfs hash should go"}</Typography>
    );
  };

  const renderTextField = () => {
    if (!showTexField) return <> </>;
    return (
      <Box sx={styles.input}>
        <Typography variant="body2" sx={styles.subtitle}>
          Gateway Base URL:
        </Typography>
        {gatewayOption === ExtensionOptions.InfuraAPI ? renderHint() : null}
        <TextField
          type="text"
          id="gatewayBaseURL"
          onChange={handleChangeGatewayBaseURL}
          value={gatewayBaseURL}
          placeholder="{ipfs}.gateway.com"
          sx={styles.inputField}
          variant="filled"
        />
      </Box>
    );
  };

  return (
    <Box sx={styles.main}>
      <Box sx={styles.column}>
        <Box sx={styles.fields}>
          <Typography variant="body1" sx={styles.title}>
            Download Files via
          </Typography>
          {renderDropDownMenu()}
          {renderTextField()}
          {showUserId && <ShowUserId />}
        </Box>
      </Box>
    </Box>
  );
};

export default MainScreen;
