'use strict';

const chai = require('chai');
const expect = chai.expect;
const chaiSubset = require('chai-subset');
const chaiAsPromised = require('chai-as-promised');
const {config, getConnection} = require('./hooks/global-hooks');
const {listSetup, listCleanup} = require('./hooks/list-hooks');
const {makeRemotePath, splitRemotePath} = require('./hooks/global-hooks');

chai.use(chaiSubset);
chai.use(chaiAsPromised);

describe('list() method tests', function () {
  let sftp;

  before('List test setup hook', async function () {
    sftp = await getConnection();
    await listSetup(sftp, config.sftpUrl, config.localUrl);
    return true;
  });

  after('list test cleanup hook', async function () {
    await listCleanup(sftp, config.sftpUrl);
    return true;
  });

  it('list return should be a promise', function () {
    let p = sftp.list(makeRemotePath(config.sftpUrl, 'list-test'));
    expect(p).to.be.a('promise');
    return expect(p).to.be.fulfilled;
  });

  it('list return for empty directory should be empty', function () {
    return expect(
      sftp.list(makeRemotePath(config.sftpUrl, 'list-test/empty'))
    ).to.become([]);
  });

  it('list non-existent directory rejected', function () {
    return expect(
      sftp.list(makeRemotePath(config.sftpUrl, 'list-test/not-exist'))
    ).to.be.rejectedWith('No such directory');
  });

  it('list existing dir returns details of each entry', async function () {
    let data = await sftp.list(makeRemotePath(config.sftpUrl, 'list-test'));

    expect(data.length).to.equal(7);
    return expect(data).to.containSubset([
      {type: 'd', name: 'dir1'},
      {type: 'd', name: 'dir2'},
      {type: 'd', name: 'empty'},
      {type: '-', name: 'file1.html'},
      {type: '-', name: 'file2.md'},
      {type: '-', name: 'test-file1.txt'},
      {type: '-', name: 'test-file2.txt.gz'}
    ]);
  });

  it('list with /.*/ regexp', async function () {
    let data = await sftp.list(
      makeRemotePath(config.sftpUrl, 'list-test'),
      /.*/
    );

    expect(data.length).to.equal(7);
    return expect(data).to.containSubset([
      {type: 'd', name: 'dir1'},
      {type: 'd', name: 'dir2'},
      {type: 'd', name: 'empty'},
      {type: '-', name: 'file1.html'},
      {type: '-', name: 'file2.md'},
      {type: '-', name: 'test-file1.txt'},
      {type: '-', name: 'test-file2.txt.gz'}
    ]);
  });

  it('list with /dir.*/ regexp', async function () {
    let data = await sftp.list(
      makeRemotePath(config.sftpUrl, 'list-test'),
      /dir.*/
    );

    expect(data.length).to.equal(2);
    return expect(data).to.containSubset([
      {type: 'd', name: 'dir1'},
      {type: 'd', name: 'dir2'}
    ]);
  });

  it('list with /.*txt/ regexp', async function () {
    let data = await sftp.list(
      makeRemotePath(config.sftpUrl, 'list-test'),
      /.*txt/
    );

    expect(data.length).to.equal(2);
    return expect(data).to.containSubset([
      {type: '-', name: 'test-file1.txt'},
      {type: '-', name: 'test-file2.txt.gz'}
    ]);
  });

  it('list with * glob pattern', async function () {
    let data = await sftp.list(
      makeRemotePath(config.sftpUrl, 'list-test'),
      '*'
    );

    expect(data.length).to.equal(7);
    return expect(data).to.containSubset([
      {type: 'd', name: 'dir1'},
      {type: 'd', name: 'dir2'},
      {type: 'd', name: 'empty'},
      {type: '-', name: 'file1.html'},
      {type: '-', name: 'file2.md'},
      {type: '-', name: 'test-file1.txt'},
      {type: '-', name: 'test-file2.txt.gz'}
    ]);
  });

  it('list with dir* glob pattern', async function () {
    let data = await sftp.list(
      makeRemotePath(config.sftpUrl, 'list-test'),
      'dir*'
    );

    expect(data.length).to.equal(2);
    return expect(data).to.containSubset([
      {type: 'd', name: 'dir1'},
      {type: 'd', name: 'dir2'}
    ]);
  });

  it('list with *txt pattern', async function () {
    let data = await sftp.list(
      makeRemotePath(config.sftpUrl, 'list-test'),
      '*txt'
    );

    expect(data.length).to.equal(2);
    return expect(data).to.containSubset([
      {type: '-', name: 'test-file1.txt'},
      {type: '-', name: 'test-file2.txt.gz'}
    ]);
  });

  it('list with relative path', async function () {
    let data = await sftp.list('./testServer');
    return expect(data.length).to.equal(1);
  });

  it('list with "." path', async function () {
    let data = await sftp.list('.');
    return expect(data).to.containSubset([{type: 'd', name: 'testServer'}]);
  });

  it(`list with absolute path ${config.sftpUrl} and pattern`, async function () {
    let data = await sftp.list(config.sftpUrl, 'list*');
    return expect(data).to.containSubset([{name: 'list-test'}]);
  });
});
