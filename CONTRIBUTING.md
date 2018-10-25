Contributing to Cacher Run Server
=================================

Thanks for helping make Cacher better for coders!

`@cacherapp/run-server` is an [NPM Node](https://www.npmjs.com/) package written in 
[Typescript](https://www.typescriptlang.org/) (v2.7) and compiled into Javascript (es2017) for distributon.

## Step 1: Run TSLint

Run `tslint` to check that your code conforms to the rules set by [tslint.json](tslint.json):

```bash
npm run lint
```

Fix any errors and warnings.

## Step 2: Manual Checks

Make sure the server builds and starts:

```bash
npm start https://app.cacher.io
```

Open a browser tab to [https://app.cacher.io](https://app.cacher.io). Click to open the Run Server dialog:

![Run Server Dialog](images/run-dialog.png)

Input your server's port and token and press **Connect**. Once the Run Server is connected, try to run a file example
which might be affected by your changes. For example:

```java
// HelloWorld.java
public class HelloWorld {
    public static void main(String[] args) { 
        System.out.println("Hello, World");
    }
}
```

## Step 3: Submit the Pull Request

Please respect the [Code of Conduct](code-of-conduct.md) when creating your PR. Once it has been submitted, we will
review your code within a few business days and make suggestions as necessary. 
