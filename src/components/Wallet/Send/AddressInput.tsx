import CheckIcon from "@mui/icons-material/Check";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import {type Theme} from "@mui/material/styles";
import React, {useEffect, useRef, useState} from "react";

import {
  getAddressMetadata,
  getProfileData,
} from "../../../api/domainProfileActions";
import useResolverKeys from "../../../hooks/useResolverKeys";
import {makeStyles} from "@mui/styles";
import {DomainFieldTypes, ResolverKeyName, TokenEntry} from "../../../types";
import {isDomainValidForManagement} from "../../../util/domain/format";
import ManageInput from "../ManageInput";
import {isValidRecordKeyValue} from "../../../util/resolverKeys";

const useStyles = makeStyles((theme: Theme) => ({
  loader: {
    display: "flex",
    alignItems: "center",
    marginRight: "8px",
  },
  checkIcon: {
    color: theme.palette.success.main,
    height: "16px",
    width: "16px",
  },
  resolvedContainer: {
    display: "flex",
    alignItems: "center",
    minHeight: "20px",
    marginTop: theme.spacing(1),
  },
  resolvedText: {
    color: "gray",
    marginLeft: theme.spacing(1),
  },
}));

const getRecordKey = (symbol: string): ResolverKeyName => {
  if (symbol === "MATIC") {
    return `crypto.MATIC.version.MATIC.address`;
  }
  return `crypto.${symbol}.address` as ResolverKeyName;
};

type Props = {
  onAddressChange: (value: string) => void;
  onResolvedDomainChange: (value: string) => void;
  placeholder: string;
  initialResolvedDomainValue: string;
  initialAddressValue: string;
  label: string;
  asset: TokenEntry;
};

const AddressInput: React.FC<Props> = ({
  onAddressChange,
  onResolvedDomainChange,
  placeholder,
  initialAddressValue,
  initialResolvedDomainValue,
  label,
  asset,
}) => {
  const [address, setAddress] = useState<string>(initialAddressValue);
  const [resolvedDomain, setResolvedDomain] = useState<string>(
    initialResolvedDomainValue,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const classes = useStyles();
  const {unsResolverKeys} = useResolverKeys();
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const resolveDomain = async (
    addressOrDomain: string,
    symbol: string,
  ): Promise<string> => {
    const recordKey = getRecordKey(symbol);
    const profileData = await getProfileData(addressOrDomain, [
      DomainFieldTypes.Records,
      DomainFieldTypes.CryptoVerifications,
    ]);
    const recordValue = profileData?.records
      ? profileData?.records[recordKey]
      : "";
    return recordValue;
  };

  const validateAddress = (value: string) => {
    const validationSymbols = [asset.ticker, asset.symbol];
    for (const symbol of validationSymbols) {
      const recordKey = getRecordKey(symbol);
      const isValid = isValidRecordKeyValue(recordKey, value, unsResolverKeys);
      onAddressChange(isValid ? value : "");
      setError(!isValid);
      if (isValid) {
        return isValid;
      }
    }
    return false;
  };

  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);

  const onChange = async (id: string, addressOrDomain: string) => {
    onResolvedDomainChange("");
    onAddressChange("");
    setErrorMessage("");
    setAddress(addressOrDomain);
    setResolvedDomain("");

    // clear the existing timeout
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    // reverse resolve address to name
    if (validateAddress(addressOrDomain)) {
      timeout.current = setTimeout(async () => {
        setIsLoading(true);
        const resolutionData = await getAddressMetadata(addressOrDomain);
        setIsLoading(false);
        if (resolutionData?.name) {
          setAddress(addressOrDomain);
          setResolvedDomain(resolutionData.name);
          onResolvedDomainChange(resolutionData.name);
          onAddressChange(addressOrDomain);
        }
      }, 500);
    }

    // forward resolve domain to address
    if (isDomainValidForManagement(addressOrDomain)) {
      timeout.current = setTimeout(async () => {
        setIsLoading(true);
        const resolvedAddress =
          (await resolveDomain(addressOrDomain, asset.ticker)) ||
          (await resolveDomain(addressOrDomain, asset.symbol));
        setIsLoading(false);
        if (!resolvedAddress || !validateAddress(resolvedAddress)) {
          setErrorMessage(
            `Could not resolve ${addressOrDomain} to a valid ${asset.ticker} address`,
          );
          return;
        }
        setAddress(resolvedAddress);
        setResolvedDomain(addressOrDomain);
        onResolvedDomainChange(addressOrDomain);
        onAddressChange(resolvedAddress);
      }, 500);
    }
  };

  return (
    <Box>
      <ManageInput
        mt={2}
        id="address-input"
        value={address}
        label={label}
        placeholder={placeholder}
        onChange={onChange}
        disabled={isLoading}
        endAdornment={
          isLoading ? (
            <div className={classes.loader} data-testid="loader">
              <CircularProgress size={23} />
            </div>
          ) : undefined
        }
        errorText={errorMessage}
        error={error || !!errorMessage}
        stacked={true}
      />
      <Box className={classes.resolvedContainer}>
        {resolvedDomain && (
          <>
            <CheckIcon className={classes.checkIcon} />
            <Typography variant="caption" className={classes.resolvedText}>
              Successfully resolved {resolvedDomain}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

export default AddressInput;
