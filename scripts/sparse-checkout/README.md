# Sparse checkout

- zsh

```
ORG="tiagobento"
BRANCH="tb-tests"
PKGS="@kie-tools/boxed-expression-component"
bash <(curl -s https://raw.githubusercontent.com/$ORG/kie-tools/$BRANCH/scripts/sparse-checkout/run.sh) $ORG $BRANCH ${(z)PKGS}
```

---

- bash

```
ORG="tiagobento"
BRANCH="tb-tests"
PKGS="@kie-tools/boxed-expression-component"
bash <(curl -s https://raw.githubusercontent.com/$ORG/kie-tools/$BRANCH/scripts/sparse-checkout/run.sh) $ORG $BRANCH $PKGS
```
