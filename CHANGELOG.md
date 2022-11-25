# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.4.2](https://github.com/tookey-io/backend/compare/v1.4.1...v1.4.2) (2022-11-25)


### Bug Fixes

* **keys:** response with empty list keys instead of not found exception ([98b7bae](https://github.com/tookey-io/backend/commit/98b7baebbcf3b6c5be100ee304a1c6cfecc55619))
* update keys list & auth signin response dtos ([dbe19e7](https://github.com/tookey-io/backend/commit/dbe19e716d62ddb1c7896792db8638b794b1a61b))

### [1.4.1](https://github.com/tookey-io/backend/compare/v1.4.0...v1.4.1) (2022-11-20)


### Bug Fixes

* auth qr code counter ([d9b6ba2](https://github.com/tookey-io/backend/commit/d9b6ba2cbd50a1f38bf3c2fec5e559158dc466e3))
* deeplink url update ([7c8f5e0](https://github.com/tookey-io/backend/commit/7c8f5e002b864b93334816ada18d2346013745c1))
* signin & refresh methods as post ([e0b8035](https://github.com/tookey-io/backend/commit/e0b8035767d643221923391d15a5019e7766599d))

## [1.4.0](https://github.com/tookey-io/backend/compare/v1.3.0...v1.4.0) (2022-11-18)


### Features

* **bot:** exception filter ([2f7cbaf](https://github.com/tookey-io/backend/commit/2f7cbaf21d392a5fbb8a1876665b8dd815c3ec9d))
* **key manage:** display owner username or shared with usernames ([c9394f5](https://github.com/tookey-io/backend/commit/c9394f518cc0c0c2d699a6429f4c0c9bc821ce63))

## [1.3.0](https://github.com/tookey-io/backend/compare/v1.2.1...v1.3.0) (2022-11-17)


### Features

* **key share:** key sharing with telegram users flow, referral start link ([6077010](https://github.com/tookey-io/backend/commit/60770109027b665b4018ad4a3254e6f0bb318008))


### Bug Fixes

* **sign:** wrong regexp ([f316377](https://github.com/tookey-io/backend/commit/f3163779579d6afa510c4cb1064ba3fb6434a990))

### [1.2.1](https://github.com/tookey-io/backend/compare/v1.2.0...v1.2.1) (2022-11-17)


### Bug Fixes

* **event emitter:** use event uuid when sending key create and key sign requests ([8191159](https://github.com/tookey-io/backend/commit/8191159ca5a0bdb029b483ef39f30f4c336f9898))
* fix null types ([d72e965](https://github.com/tookey-io/backend/commit/d72e9655d52ea279cdf8b537aabdff619e077ef3))

## [1.2.0](https://github.com/tookey-io/backend/compare/v1.1.1...v1.2.0) (2022-11-17)


### Features

* **auth:** update auth flow, add access & refresh jwt tokens, access token is otp now ([95944ad](https://github.com/tookey-io/backend/commit/95944ad5ef92a065297736ffd95eca973bb59602))

### [1.1.1](https://github.com/tookey-io/backend/compare/v1.1.0...v1.1.1) (2022-11-17)


### Bug Fixes

* **migration:** fix initial migration ([38bb977](https://github.com/tookey-io/backend/commit/38bb9777b562bbde690dd0c0f73e7bf9f9f5c1bc))

## 1.1.0 (2022-11-17)


### Features

* add bot /keys command, hide keys with timeout status ([f3c5aa9](https://github.com/tookey-io/backend/commit/f3c5aa94fdff1b6501c227695258d833a6b24eb4))
* add bot menu item, move from keys scene ([609aef9](https://github.com/tookey-io/backend/commit/609aef9de11300a1a21496d830c5179656c6d04f))
* add env PG_SSL ([f334d44](https://github.com/tookey-io/backend/commit/f334d448984a231d620ce5ab65cdad3b1ab7d3dd))
* add ransactions ([940b55e](https://github.com/tookey-io/backend/commit/940b55e6a3a9bc346fc406be4d241c4e4fb5da95))
* Add release to docker ([251fb28](https://github.com/tookey-io/backend/commit/251fb2894bbb245420ad7e9f8df829bdae20f41c))
* Add release to docker.2 ([1f3f9ea](https://github.com/tookey-io/backend/commit/1f3f9ea8dfcd0dd439e39897d54c9615f194c8c3))
* delete qr action ([6934189](https://github.com/tookey-io/backend/commit/6934189265dab1fae962aa5a48a055816c8b2c8e))
* enrich telegram user profile ([5f961c4](https://github.com/tookey-io/backend/commit/5f961c4d5ebedf6b101e6f8673c7ceb8c892c819))
* get user keys from participation ([0f830a6](https://github.com/tookey-io/backend/commit/0f830a63099146ee478ea3539e4d462aa2e5cbda))
* initialize ([c67c5fc](https://github.com/tookey-io/backend/commit/c67c5fcf99a1b8374d9d98d856ecb00a026b23fc))
* it's works ([ba590ed](https://github.com/tookey-io/backend/commit/ba590ed151c61980c121672efcf158c424694c00))
* keep telegraf sessions in postgres ([4264492](https://github.com/tookey-io/backend/commit/4264492d92637f977c370f3c7cd6739fdf0652bb))
* key details ([92d2e2e](https://github.com/tookey-io/backend/commit/92d2e2ea16ab96ff5d3748194c75efb752e0b881))
* key generation flow ([5070418](https://github.com/tookey-io/backend/commit/5070418f76d7ca1d2fcb33094141c03ebe80324e))
* key module, amqp lib, telegram user, dtos, apikey guard, swagger ([cb91df4](https://github.com/tookey-io/backend/commit/cb91df45afe1be20f634f510286361fd9b3133a2))
* **package.json:** add commit and release scripts ([3db3269](https://github.com/tookey-io/backend/commit/3db3269ebe6b72be3098be538535400731a3f161))
* pino logger ([e62f590](https://github.com/tookey-io/backend/commit/e62f59072c064a1cece2fc08b65e8ffc2ffe5c14))
* sign key flow, auth module with token request, fix indexes migration ([24c254e](https://github.com/tookey-io/backend/commit/24c254e4f4cd886acc30cd445e86fadb1f624bfe))
* split amqp task handler ([92e5865](https://github.com/tookey-io/backend/commit/92e58658a442dbd463ff4ca568300b4fc0f8cd35))
* telegram deeplink authentication ([bc37dea](https://github.com/tookey-io/backend/commit/bc37dea129543ec703f2bae9b7e1d1b6c43cbc84))
* typeorm initial migration, telegram-session-middleware ([8575abc](https://github.com/tookey-io/backend/commit/8575abc0d364e87c8d8b32f93d26d6a9f15477b1))
* update dtos, user services in bot instead of repositories ([133f7b0](https://github.com/tookey-io/backend/commit/133f7b0e7183dca9202db21758791d04861ca7c3))
* update prettier for migrations ([06f5f02](https://github.com/tookey-io/backend/commit/06f5f02456cfed0ecdaf333473084bd3b1d90efc))
* update prettier rule, reformat bot scenes ([fd831de](https://github.com/tookey-io/backend/commit/fd831deb84287ef60149f81f7666c4f4d5e8556a))
* user keys + pagination ([3edd3c7](https://github.com/tookey-io/backend/commit/3edd3c71298226b9f00edf8f16993fb4cf9d1be1))


### Bug Fixes

* add participantsCount for key create, add participantsConfirmation for sign ([094cb60](https://github.com/tookey-io/backend/commit/094cb603a9e6789f1dc93a817a676ef269e3e517))
* db synchronize false ([d4efc12](https://github.com/tookey-io/backend/commit/d4efc125d7a239db29cacdd9a45fb8459e2d7f16))
* fresh condition ([0fb0cdf](https://github.com/tookey-io/backend/commit/0fb0cdf58e030380d840776b4c6e5bbc68baec35))
* postgres session reject unauthorized too ([275cff5](https://github.com/tookey-io/backend/commit/275cff55c821fba6a670229019bc10bbb8395e67))
* qr code for multiple users ([08304e4](https://github.com/tookey-io/backend/commit/08304e4b1bd9b62dddbce205b2c1cd291e529df1))
* resize keyboard ([ab4e6d0](https://github.com/tookey-io/backend/commit/ab4e6d04706e2252f862ec53f0a35f0ed004b234))
* ssl reject unauthorized ([9ddfb8c](https://github.com/tookey-io/backend/commit/9ddfb8cc3d28a9cf7372469a3cfb0cacde98745f))
* telegram session log, fix access token ([8a3e8c3](https://github.com/tookey-io/backend/commit/8a3e8c3736437edea2a4356ed3b9df698ddbcec2))
* telegram user entity type ([c561a95](https://github.com/tookey-io/backend/commit/c561a95471e521b36f64cfb2587d6cea4d87cbcb))
* user dto ([2988363](https://github.com/tookey-io/backend/commit/2988363563c53b19ef1e8858742a5b4440b5a48d))
