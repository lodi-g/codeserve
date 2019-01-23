# Codeserve

## Serving code with an expressJS server

#### Why?

I needed a simple way to share code to friends on the same network, without having them
to download code or having the HTML rendered.

#### Example

```sh
$ yarn global add codeserve
$ codeserve --directory . --port 8000 --style github
# OR
$ codeserve
```

renders:

![Directory listing screenshot](.github/dir_listing.png)
![Code](.github/code.png)
