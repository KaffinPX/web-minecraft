import { ChunkTerrain } from "./ChunkTerrain.js";
import { ChunkMesher } from "./ChunkMesher.js";

var terrain = null;

class TerrainManager {
    constructor(data) {
        this.cellSize = 16;
        this.chunkTerrain = new ChunkTerrain({
            blocksDef: data.blocksDef,
        });
        this.cellNeedsUpdate = {};
        this.loadedMeshes = {};
        this.chunkMesher = new ChunkMesher({
            blocksTex: data.blocksTex,
            blocksMapping: data.blocksMapping,
            toxelSize: data.toxelSize,
            chunkTerrain: this.chunkTerrain,
        });
    }
}

var handlers = {
    init: function (data) {
        terrain = new TerrainManager(data);
    },
    setVoxel: function (data) {
        terrain.chunkTerrain.setVoxel(...data);
        var cellId = terrain.chunkTerrain.vec3(
            ...terrain.chunkTerrain.computeCellForVoxel(
                data[0],
                data[1],
                data[2]
            )
        );
        terrain.cellNeedsUpdate[cellId] = true;
        var neighbours = [
            [-1, 0, 0],
            [1, 0, 0],
            [0, -1, 0],
            [0, 1, 0],
            [0, 0, -1],
            [0, 0, 1],
        ];
        for (var l = 0; l < neighbours.length; l++) {
            var nei = neighbours[l];
            var neiCellId = terrain.chunkTerrain.vec3(
                ...terrain.chunkTerrain.computeCellForVoxel(
                    data[0] + nei[0],
                    data[1] + nei[1],
                    data[2] + nei[2]
                )
            );
            terrain.cellNeedsUpdate[neiCellId] = true;
        }
    },
    genChunkGeo: function (data) {
        queueMicrotask(() => {
            if (
                terrain.chunkTerrain.vec3(...data) in
                    terrain.chunkTerrain.cells ===
                true
            ) {
                var geo = terrain.chunkMesher.genChunkGeo(...data);
                postMessage({
                    type: "cellGeo",
                    data: {
                        cell: geo,
                        info: data,
                        p: performance.now(),
                    },
                });
            }
        });
    },
    setCell: function (data) {
        var neighbours = [
            [-1, 0, 0],
            [1, 0, 0],
            [0, -1, 0],
            [0, 1, 0],
            [0, 0, -1],
            [0, 0, 1],
        ];
        terrain.cellNeedsUpdate[
            terrain.chunkTerrain.vec3(data[0], data[1], data[2])
        ] = true;
        terrain.chunkTerrain.setCell(data[0], data[1], data[2], data[3]);
        for (var l = 0; l < neighbours.length; l++) {
            var nei = neighbours[l];
            var neiCellId = terrain.chunkTerrain.vec3(
                data[0] + nei[0],
                data[1] + nei[1],
                data[2] + nei[2]
            );
            terrain.cellNeedsUpdate[neiCellId] = true;
        }
    },
    resetWorld: function () {
        console.log("RESET WORLD!");
        terrain.chunkTerrain.cells = {};
    },
    updateCellsAroundPlayer: function (data) {
        var cell = data[0];
        var radius = data[1];
        var odw = {};
        var cellBlackList = {};
        for (var k in terrain.loadedMeshes) {
            var v = terrain.loadedMeshes[k];
            if (v === true) {
                cellBlackList[k] = true;
            }
        }
        for (var i = 0; i <= radius; i++) {
            for (var x = -i; x <= i; x++) {
                for (var y = -i; y <= i; y++) {
                    for (var z = -i; z <= i; z++) {
                        if (!odw[`${x}:${y}:${z}`]) {
                            odw[`${x}:${y}:${z}`] = true;
                            var pcell = [cell[0] + x, cell[1] + y, cell[2] + z];
                            var cellId = terrain.chunkTerrain.vec3(...pcell);
                            cellBlackList[cellId] = false;
                            var gen = false;
                            if (terrain.cellNeedsUpdate[cellId]) {
                                delete terrain.cellNeedsUpdate[cellId];
                                handlers.genChunkGeo(pcell);
                                gen = true;
                            }
                            if (terrain.loadedMeshes[cellId] === "disposed") {
                                if (!gen) {
                                    handlers.genChunkGeo(pcell);
                                }
                            }
                            terrain.loadedMeshes[cellId] = true;
                        }
                    }
                }
            }
        }
        for (k in cellBlackList) {
            v = cellBlackList[k];
            if (v === true) {
                terrain.loadedMeshes[k] = "disposed";
                postMessage({
                    type: "removeCell",
                    data: k,
                });
            }
        }
    },
};

addEventListener("message", function (e) {
    var fn = handlers[e.data.type];
    if (!fn) {
        throw new Error(`no handler for type: ${e.data.type}`);
    }
    fn(e.data.data);
});
