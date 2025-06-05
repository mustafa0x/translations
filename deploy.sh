babel --no-babelrc assets/js/js.js --out-file assets/js/js.out.js --presets=env
cat assets/js/{jquery.min,popper.min,bootstrap.min,js.out}.js > temp.js
curl -X POST -s --data-urlencode 'input@temp.js' https://javascript-minifier.com/raw > js.min.js
rm temp.js

curl -X POST -s --data-urlencode 'input@assets/css/style.css' https://cssminifier.com/raw > style.min.css
rm temp.css
