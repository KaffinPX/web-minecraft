// Generated by CoffeeScript 2.5.1
var Entities;

import * as THREE from './build/three.module.js';

Entities = class Entities {
  constructor(game) {
    this.game = game;
    this.mobMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color("red")
    });
    this.mobGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.mobMaxCount = 200;
    this.mobMesh = new THREE.InstancedMesh(this.mobGeometry, this.mobMaterial, this.mobMaxCount);
    this.mobMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.game.scene.add(this.mobMesh);
    this.dummy = new THREE.Object3D();
    return;
  }

  update(entities) {
    var i, mobs, offset;
    offset = [-0.5, 16, -0.5];
    mobs = 0;
    for (i in entities) {
      if (entities[i].type === "mob") {
        mobs++;
      }
    }
    this.mobMesh.count = mobs;
    mobs = 0;
    for (i in entities) {
      if (entities[i].type === "mob") {
        this.dummy.position.set(entities[i].position.x + offset[0], entities[i].position.y + offset[1], entities[i].position.z + offset[2]);
        this.dummy.updateMatrix();
        this.mobMesh.setMatrixAt(mobs++, this.dummy.matrix);
      }
    }
    this.mobMesh.instanceMatrix.needsUpdate = true;
  }

};

export {
  Entities
};
