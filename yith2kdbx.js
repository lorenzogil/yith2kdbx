#!/usr/bin/env node

(function () {
  "use strict";

  var program = require("commander"),
      fs = require("fs"),
      zlib = require("zlib"),
      sjcl = require("sjcl"),
      encodeString,
      generateId,
      printCsv;

  encodeString = function (str) {
    var replaceList = [['<', '&lt;'],
                       ['>', '&gt;'],
                       ['&', '&amp;'],
                       ['"', '&quot;'],
                       ["'", '&apos;']],
        result = [],
        i, j, c;
    for (i=0; i < str.length; i += 1) {
      c = str[i];
      for (j=0; j < replaceList.length; j += 1) {
        if (c === replaceList[j][0]) {
          c = replaceList[j][1];
          break;
        }
      }
      result.push(c);
    }
    return result.join('');
  };

  printCsv = function (secrets, masterPassword) {
    var i, j, s, p, g, groups = [], idx = 0, groupsIndex = {};

    for (i=0; i < secrets.length; i += 1) {
      s = secrets[i];
      if (s.tags.length === 0) {
        g = 'general';
      } else {
        g = s.tags[0];
      }

      if (groupsIndex[g] === undefined) {
        groups.push({name: g, items: []});
        groupsIndex[g] = idx;
        idx += 1;
      }

      groups[groupsIndex[g]].items.push(s);
    }
    console.log('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
    console.log('<KeePassFile>');
    console.log('  <Meta>');
    console.log('    <Generator>yith2kdbx</Generator>');
    console.log('    <DatabaseName>Yith Library</DatabaseName>');
    console.log('  </Meta>');
    console.log('  <Root>');
    console.log('    <Group>');
    console.log('      <Name>Yith Library</Name>');
    for(j=0; j < groups.length; j += 1) {
      g = groups[j];
      console.log('      <Group>');
      console.log('        <Name>' + g.name + '</Name>');
      for (i=0; i < g.items.length; i += 1) {
        s = g.items[i];
        p = sjcl.decrypt(masterPassword, s.secret);
        console.log('        <Entry>');
        // if (s.tags.length === 0) {
        //   console.log('    <group>general</group>');
        // } else {
        //   console.log('    <group>' + s.tags[0] + '</group>');
        // }
        console.log('          <Times>');
        console.log('            <CreationTime>' + s.creation + '</CreationTime>');
        console.log('            <LastModificationTime>' + s.modification + '</LastModificationTime>');
        console.log('          </Times>');
        console.log('          <String>');
        console.log('            <Key>Title</Key>');
        console.log('            <Value>' + encodeString(s.service) + '</Value>');
        console.log('          </String>');
        console.log('          <String>');
        console.log('            <Key>UserName</Key>');
        console.log('            <Value>' + encodeString(s.account) + '</Value>');
        console.log('          </String>');
        console.log('          <String>');
        console.log('            <Key>Password</Key>');
        console.log('            <Value ProtectInMemory="True">' + encodeString(p) + '</Value>');
        console.log('          </String>');
        console.log('          <String>');
        console.log('            <Key>Notes</Key>');
        console.log('            <Value>' + encodeString(s.notes) + '</Value>');
        console.log('          </String>');
        console.log('        </Entry>');
      }
      console.log('      </Group>');
    }
    console.log('    </Group>');
    console.log('  </Root>');
    console.log('</KeePassFile>');
  };

  program
    .version("0.0.1")
    .usage("<backup_file> <master_password>")
    .parse(process.argv);

  if (program.args.length !== 2) {
    console.log("Wrong number of arguments");
    console.log("Usage: " + program._usage);
    return;
  }

  try {
    zlib.unzip(fs.readFileSync(program.args[0]), function (err, buffer) {
      var secrets = JSON.parse(buffer.toString());

      if (err) {
        console.log(err);
        return;
      }

      printCsv(secrets, program.args[1]);

    });
  } catch (err) {
    console.log("An error was encountered reading the file: " + program.args[0]);
    console.log(err.message);
  }

}());
