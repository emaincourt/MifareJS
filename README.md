[![Build Status](https://travis-ci.org/emaincourt/MifareJS.svg?branch=master)](https://travis-ci.org/emaincourt/MifareJS) [![codecov](https://codecov.io/gh/emaincourt/MifareJS/branch/master/graph/badge.svg)](https://codecov.io/gh/emaincourt/MifareJS)

## MifareJS :pig:  - Mifare for dummies

***

A LibNFC and MFOC NodeJS wrapper to read/write data from/to ISO/IEC 14443 A compliant tags. This repository can also be seen as a playground for a better understanding of Mifare technologies.

I am not an expert in RFID nor NFC technologies but really enjoyed deep diving inside. I would be glad you to correct me if something is wrong.

Let's take a tour.

### :dolls: Dependencies

Before being able to use this library, you need to install both `libNFC` and `mfoc` libraries (use brew on OSX) :

```bash
brew install libnfc brew
```

Moreover, you'll need a NFC reader to be able to play with Mifare chipsets. I'm personnaly using [Identive SCM SCL3711](https://www.amazon.fr/Identive-905169-SCM-SCL3711-USB/dp/B00G6G1WH2) but it doesn't really matter. Only make sure that you're using one that is part of the offical [LibNFC list](http://nfc-tools.org/index.php?title=Devices_compatibility_matrix). If you want to go deeper, I would advise you to take a look at the great work of Johnatan Westhues who developed [Proxmark](https://github.com/Proxmark/proxmark3/wiki) which is definitely the best audit tool for NFC/RFID technologies with also a highly active community.

### :hand: What is Mifare ?

Mifare is a communication protocol that partially relies on ISO 14443 standards. In case of Mifare Classic, only layers 1 and 2 are taking advantage of the standards. Transmission and communication protocols, respectively 4th and 3rd layers, rely on the NXP CRYPTO-1 protocol that [has been broken in 2008 by Karsten Nohl and Henryk Plötz](https://www.blackhat.com/presentations/bh-usa-08/Nohl/BH_US_08_Nohl_Mifare.pdf)

### :unamused: RFID, NFC ?

Contactless devices can most of the time either be considered as RFID or NFC devices. The differences between these two types mainly rely on the frequency. RFID devices (which stands for Radio Frequency Identification) are Low Frequency devices (operating @ 125kHz up to 134,2 kHz). On the other hand, NFC (Near Field Contact) devices are considered as High Frequency devices (13,56MHz). Contactless cards can be found quite everywhere and it might be useful for security reasons to be aware of their opportunities but also of their weaknesses.

#### :mag_right: How does the Mifare Classic 1K technology work ?

Better than making mistakes during the explanation of all the protocols, I better invite you to take a look at some great documents that have been written by far more experts about the subject :
- [Original lecture by Karsten Nohl and Henryk Plötz @ CCC ](https://events.ccc.de/congress/2008/Fahrplan/attachments/1241_081229.25C3.RFIDSecurity.pdf)
- [Ciphertext-only Cryptanalysis on Hardened Mifare Classic
Cards](http://www.cs.ru.nl/~rverdult/Ciphertext-only_Cryptanalysis_on_Hardened_Mifare_Classic_Cards-CCS_2015.pdf)
- [Hacking Mifare Classic Cards](https://www.blackhat.com/docs/sp-14/materials/arsenal/sp-14-Almeida-Hacking-MIFARE-Classic-Cards-Slides.pdf)
- [APDU commands for communication](http://read.pudn.com/downloads157/doc/701059/Mifare%20APDU.pdf)

### :unlock: Authentication for Mifare

Each Mifare Classic card can be splitted in 16 sectors of data. Each sector has two authentication keys : key A and key B. Both of it are contained into the last memory block of each sector according to the following structure :

![Mifare authentication](https://img4.hostingpics.net/pics/613126Capturedecran20170809a181719.png)

Key A and key B can have read or read-write access.

The main issue with CRYPTO-1 protocol is that from one given key, you can easily (thanks to the great work of [Nethemba about Offline Attack of Mifare cards](https://nethemba.com/resources/mifare-classic-slides.pdf) which has been implemented into the [mfoc](https://github.com/nfc-tools/mfoc) library) deduce all the others. Since a lot of chipsets resellers use default keys for production, a single portion of mutual keys can help you breaking all the others. I've been looking for building a consistent database for a while. Here is part of it. These keys are in the `keys.txt` file at the root of the project. Other can be found on internet, but keep in mind that it might be illegal to publish it. Most of the keys will need you to brute force a tag. If you have the opportunity to get a few tags, you'll be able to exponentially increase your ability to unlock all the others. That said, there are two ways I am aware of to brute force a tag :

- [mfcuk](https://github.com/nfc-tools/mfcuk) for Mifare Classic Universal Toolkit (never managed to make it work and might take a few time)
- [proxmark3](https://store.ryscc.com/) as said before that can provide you much more tools than any other library. If you don't mind spending $300, go for it. Surprisingly powerful.

There is a last thing you need to be aware of : the specific sector 0. Out of 16 other ones which content can be overwritten, the sector 0 contains a few unique informations that can not be erased :

- UID
- BCC
- SAK
- ATAQ
- Manufacturer Data

The UID of the tag is basically what identifies it to the reader. When you're looking for cloning a tag, it's not only about cloning the content of all the other sectors but also being able to give both the original and the clone the same "name". Common tags that you can find on the market won't allow you to do so since their sector 0 is read only. But some chinese clones will. Moreover there are two types of chinese cards (probably more, a bit hard to know) :

- Basic chinese Mifare 1K that provide an APDU command for unlocking sector 0 and being able to write data. If ACK is received, then you can send the new data to the tag (and reset it's UID)
- 2nd generation chinese Mifare 1K, that removed this APDU command and allow you to immediately write data into sector 0

The `nfc-mfclassic` command from the `libnfc` library will not allow you to write the sector 0 with a 2nd generation card. However you can do it with a Proxmark or also fork the libnfc library to remove the specific case for sector 0.

### :notebook_with_decorative_cover: Documentation

For getting started, instanciate a new `LockSmith`. The only parameter that can be provided to it's constructor is an object that might contain the following keys :

- `keys`, additional keys that should be added to the default ones for authenticating to the tags.

- `workspace`, the workspace that will be used for storing dumps

- `defaultKeys`, path to a file that contains the default keys that should be used for authentication. If none is provided, the root `keys.txt` file will be used. I recommend not to set it. Prefer using `keys` for adding values

```javascript
import LockSmith from 'mifareJS';

const lockSmith = new LockSmith({
  keys: ['a5b6c7d8', 'a1b2c3d4'],
  workspace: '/mifare',
});
```

#### How to dump a tag ?

```javascript
import LockSmith from 'mifareJS';

const lockSmith = new LockSmith();

await lockSmith.dump('tag.mfd');
```

#### How to get the hex data from dump ?

```javascript
import LockSmith from 'mifareJS';

const dump = await LockSmith.readHexFile('./tag.mfd', true); // The second parameter can be set to false if you don't want the hex content to be displayed in standard output
```

#### Clone a tag's content onto another one

We'll here guide you on the way cloning a tag. Let's say you do have a chinese empty tag and your own, which you would like to duplicate. Let's call their dump `chinese.mfd` and `original.mfd`. The last parameter of the `clone` methods lets you tell if we should unlock sector 0 (Chinese Mifare 1K) or not (Classic tag).

```javascript
import LockSmith from 'mifareJS';

const lockSmith = new LockSmith();

// Place the chinese tag on the reader
await lockSmith.dump('chinese.mfd');
// Place the original tag on the reader
await lockSmith.dump('original.mfd');
// Then write the content of the original onto the chinese one
await LockSmith.clone('original.mfd', 'chinese.mfd', true);

```
