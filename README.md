# VPN-OTP tool

This tool helps to connect to a VPN via OpenVPN with OTP (one-time password) authentication.

The tool is written in [Deno](https://deno.land/) and runs directly from the source code.

You have a password and a secret key (base32 format) for OTP authentication.

The tool generates a one-time password, appends it to the password and passes it to OpenVPN.

Also, you need an OpenVPN config file (for example, `user.ovpn`).

The `VPN_CONFIG` environment variable should contain the path to the OpenVPN config file.

Alternatively, you can put the content of the config file to the `VPN_CONFIG` environment variable as the multiline string. 

Ensure that the string is quoted with single quotes because double quotes are used in the configuration.

The config example is provided in the `.env.example` file.

If the value of `VPN_CONFIG` is a single line without newlines, it will be used as the path to the file. If the value contains newlines and the "BEGIN" word, it will be used as the content of the config.

`.env` file example:

```env
VPN_USERNAME=username
VPN_PASSWORD=password
VPN_OTP_SECRET=secret-base32
VPN_CONFIG=user.ovpn
```

NOTE: Make sure that `VPN_OTP_SECRET` is in base32 format, not base64 or hex.

## Usage

The following command runs the tool directly from the repository.

`-A` flag allows access to the file system, environment variables and network.

`-r` flag prevents from caching the remote file so that the latest version will be used.

`--env` flag allows to pass the path to the `.env` file. If the flag is not set, the tool will try to find the `.env` file in the current directory.

```bash
deno run -A --env=PATH_TO_VPN_ENV_FILE -r https://github.com/begoon/vpn-otp/raw/main/main.ts'
```

For example, you may create an alias in your `.bashrc` or `.zshrc:`

```bash
alias vpn="deno run -A --env=$HOME/.ssh/vpn.env -r https://github.com/begoon/vpn-otp/raw/main/main.ts"
```

and then run it as

```bash
vpn
```

or with verbose output

```bash
vpn -vv
```

The VPN config in this example is located in the `$HOME/.ssh/vpn.env` file.

NOTE: To execute OpenVPN, macOS will ask `sudo` password the first time.

## User experience

The tool is designed to be in the console interactively.

After the connection to the VPN is established, the tool will print the public IP address and keep the connection alive until you press `Ctrl+C`.

## Security

Ensure that your environment variables file with the password and the secret key is only readable by you.

The tool does not store any data.
