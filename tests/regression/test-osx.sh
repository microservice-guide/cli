#!/bin/bash

echo "===== PULLING REPOSITORIES ===="
mkdir repos
cd repos
git clone -q https://github.com/microservices/d.git
git clone -q https://github.com/microservices/go.git
git clone -q https://github.com/microservices/node.git
git clone -q https://github.com/microservices/java.git
git clone -q https://github.com/microservices/python.git
git clone -q https://github.com/microservices/ruby.git
git clone -q https://github.com/microservices/scala.git
#git clone -q https://github.com/microservices/python-events.git
#git clone -q https://github.com/microservices/node-events.git
git clone -q https://github.com/omg-services/base64.git
git clone -q https://github.com/omg-services/hashes.git
# git clone -q https://github.com/JeanBarriere/jwt.git

echo "===== OMG VERSION ====="
../bin/omg -V

echo "===== TESTING TEMPLATES ====="
echo "===== Testing d ====="
cd d
output="$(../../bin/omg run --raw message -a name="Peter" | jq -c .)"
if [ "$output" != '{"message":"Hello Peter"}' ] ; then echo "$output"; exit 1; fi

echo "===== Testing go ====="
cd ../go
output="$(../../bin/omg run --raw message -a name="Peter" | jq -c .)"
if [ "$output" != '{"message":"Hello Peter"}' ] ; then echo "$output"; exit 1; fi

echo "===== Testing node ====="
cd ../node
output="$(../../bin/omg run --raw message -a name="Peter" | jq -c .)"
if [ "$output" != '{"message":"Hello Peter"}' ] ; then echo "$output"; exit 1; fi

echo "===== Testing java ====="
cd ../java
output="$(../../bin/omg run --raw message -a name="Peter" | jq -c .)"
if [ "$output" != '{"message":"Hello Peter"}' ] ; then echo "$output"; exit 1; fi

echo "===== Testing python ====="
cd ../python
output="$(../../bin/omg run --raw message -a name="Peter" | jq -c .)"
if [ "$output" != '{"message":"Hello Peter"}' ] ; then echo "$output"; exit 1; fi

echo "===== Testing ruby ====="
cd ../ruby
output="$(../../bin/omg run --raw message -a name="Peter" | jq -c .)"
if [ "$output" != '{"message":"Hello Peter"}' ] ; then echo "$output"; exit 1; fi

echo "===== Testing scala ====="
cd ../scala
output="$(../../bin/omg run --raw message -a name="Peter" | jq -c .)"
if [ "$output" != '{"message":"Hello Peter"}' ] ; then echo "$output"; exit 1; fi


echo "===== TESTING BASIC SERVICES ====="
echo "===== Testing base64 ====="
cd ../base64
output="$(../../bin/omg run --raw encode -a content="Peter")"
if [ "$output" != 'UGV0ZXI=' ] ; then echo "$output"; exit 1; fi
output="$(../../bin/omg run --raw decode -a content="UGV0ZXI=")"
if [ "$output" != 'Peter' ] ; then echo "$output"; exit 1; fi

echo "===== Testing hashes ====="
cd ../hashes
output="$(../../bin/omg run --raw digest -a method="sha1" -a data="foo" | jq -c .)"
if [ "$output" != '{"method":"sha1","digest":"0BEEC7B5EA3F0FDBC95D0DD47F3C5BC275DA8A33"}' ] ; then echo "$output"; exit 1; fi
output="$(../../bin/omg run --raw hmac -a method="sha1" -a data="hello world" -a secret="my secret" | jq -c .)"
if [ "$output" != '{"method":"sha1","digest":"9F60EE4B05E590A7F3FAC552BFB9D98FA46F78D9"}' ] ; then echo "$output"; exit 1; fi

# echo "===== Testing jwt ====="
# cd ../jwt
# output="$(../../bin/omg run --raw sign -a data="hello world" -a secret="abc" -a expiresIn="2h" | jq -c .)"
# if [ "$output" != 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiaGVsbG8gd29ybGQiLCJpYXQiOjE1NDM5MjMyMTAsImV4cCI6MTU0MzkzMDQxMH0.FCsstg1m01goffz0cFYxZIUe0uPybUAqzGRnZPJgGBw' ] ; then echo "$output"; exit 1; fi
# output="$(../../bin/omg run --raw verify -a token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiaGVsbG8gd29ybGQiLCJpYXQiOjE1NDM5MjMyMTAsImV4cCI6MTU0MzkzMDQxMH0.FCsstg1m01goffz0cFYxZIUe0uPybUAqzGRnZPJgGBw" | jq -c .)"
# if [ "$output" != '{"data":"hello world","iat":1543923210,"exp":1543930410}' ] ; then echo "$output"; exit 1; fi
