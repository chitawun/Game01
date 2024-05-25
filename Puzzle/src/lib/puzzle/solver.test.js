import { describe, expect, it } from 'vitest';
import { HexaGrid } from './grids/hexagrid';
import { Cell, Solver } from './solver';

describe('Test hexagrid cell constraints', () => {
	const grid = new HexaGrid(3, 3, false);

	it('Starts with correct possible states from initial orientation - deadend', () => {
		const index = 0;
		const initial = 1;
		let cell = new Cell(grid.polygon_at(index), initial);
		expect(cell.possible.size).toBe(6);
		expect([...cell.possible]).toEqual(expect.arrayContaining([1, 2, 4, 8, 16, 32]));
	});

	it('Starts with correct possible states from initial orientation - sharp turn', () => {
		const index = 0;
		const initial = 3;
		let cell = new Cell(grid.polygon_at(index), initial);
		expect(cell.possible.size).toBe(6);
		expect([...cell.possible]).toEqual(expect.arrayContaining([3, 6, 12, 24, 48, 33]));
	});

	it('Starts with correct possible states from initial orientation - straight', () => {
		const index = 0;
		const initial = 9;
		let cell = new Cell(grid.polygon_at(index), initial);
		expect(cell.possible.size).toBe(3);
		expect([...cell.possible]).toEqual(expect.arrayContaining([9, 18, 36]));
	});

	it('Drops configurations that contradict walls - deadend', () => {
		const index = 0;
		const initial = 1;
		let cell = new Cell(grid.polygon_at(index), initial);
		cell.addWall(8);
		cell.applyConstraints();
		expect(cell.possible.size).toBe(5);
		expect([...cell.possible]).toEqual(expect.arrayContaining([1, 2, 4, 16, 32]));
	});

	it('Drops configurations that contradict walls - straight', () => {
		const index = 0;
		const initial = 9;
		let cell = new Cell(grid.polygon_at(index), initial);
		cell.addWall(2);
		cell.applyConstraints();
		expect(cell.possible.size).toBe(2);
		expect([...cell.possible]).toEqual(expect.arrayContaining([9, 36]));
	});

	it('Drops configurations that contradict walls - sharp turn', () => {
		const index = 0;
		const initial = 3;
		let cell = new Cell(grid.polygon_at(index), initial);
		cell.addWall(2);
		cell.applyConstraints();
		expect(cell.possible.size).toBe(4);
		expect([...cell.possible]).toEqual(expect.arrayContaining([12, 24, 48, 33]));
	});

	it('Drops configurations that contradict connections - deadend', () => {
		const index = 0;
		const initial = 1;
		let cell = new Cell(grid.polygon_at(index), initial);
		cell.addConnection(8);
		cell.applyConstraints();
		expect(cell.possible.size).toBe(1);
		expect([...cell.possible]).toEqual(expect.arrayContaining([8]));
	});

	it('Drops configurations that contradict connections - straight', () => {
		const index = 0;
		const initial = 9;
		let cell = new Cell(grid.polygon_at(index), initial);
		cell.addConnection(2);
		cell.applyConstraints();
		expect(cell.possible.size).toBe(1);
		expect([...cell.possible]).toEqual(expect.arrayContaining([18]));
	});

	it('Drops configurations that contradict connections - sharp turn', () => {
		const index = 0;
		const initial = 3;
		let cell = new Cell(grid.polygon_at(index), initial);
		cell.addConnection(2);
		cell.applyConstraints();
		expect(cell.possible.size).toBe(2);
		expect([...cell.possible]).toEqual(expect.arrayContaining([3, 6]));
	});

	it('Reports correct added features - deadend', () => {
		const index = 0;
		const initial = 1;
		let cell = new Cell(grid.polygon_at(index), initial);
		cell.addConnection(2);
		const { addedConnections, addedWalls } = cell.applyConstraints();
		expect(addedConnections).toBe(0);
		expect(addedWalls).toBe(61);
	});

	it('Reports correct added features - straight', () => {
		const index = 0;
		const initial = 9;
		let cell = new Cell(grid.polygon_at(index), initial);
		cell.addConnection(2);
		const { addedConnections, addedWalls } = cell.applyConstraints();
		expect(addedConnections).toBe(16);
		expect(addedWalls).toBe(45);
	});

	it('Reports correct added features - wide turn', () => {
		const index = 0;
		const initial = 5;
		let cell = new Cell(grid.polygon_at(index), initial);
		cell.addConnection(2);
		const { addedConnections, addedWalls } = cell.applyConstraints();
		expect(addedConnections).toBe(0);
		expect(addedWalls).toBe(21);
	});

	it('Reports correct added features - X', () => {
		const index = 0;
		const initial = 54;
		let cell = new Cell(grid.polygon_at(index), initial);
		cell.addWall(1);
		const { addedConnections, addedWalls } = cell.applyConstraints();
		expect(addedConnections).toBe(54);
		expect(addedWalls).toBe(8);
	});

	it('Throws error if no orientations are possible - X', () => {
		const index = 0;
		const initial = 54;
		let cell = new Cell(grid.polygon_at(index), initial);
		cell.addWall(3);
		expect(cell.applyConstraints).toThrowError('No orientations possible');
	});
});

describe('Test cell cloning', () => {
	const grid = new HexaGrid(1, 1, false);

	it('Makes a copy of the cell', () => {
		const cell = new Cell(grid.polygon_at(0), 1);
		const clone = cell.clone();
		expect(clone.initial).toBe(cell.initial);
		expect([...clone.possible]).toEqual(expect.arrayContaining([...cell.possible]));
	});

	it('Removing orientation from cell does not affect clone', () => {
		const cell = new Cell(grid.polygon_at(0), 1);
		const possible = [...cell.possible];
		const clone = cell.clone();
		cell.possible.delete(1);
		expect([...clone.possible]).toEqual(expect.arrayContaining(possible));
		expect([...cell.possible]).toEqual(expect.arrayContaining(possible.filter((x) => x !== 1)));
	});

	it('Removing orientation from clone does not affect cell', () => {
		const cell = new Cell(grid.polygon_at(0), 1);
		const possible = [...cell.possible];
		const clone = cell.clone();
		clone.possible.delete(1);
		expect([...cell.possible]).toEqual(expect.arrayContaining(possible));
		expect([...clone.possible]).toEqual(expect.arrayContaining(possible.filter((x) => x !== 1)));
	});
});

describe('Test solver border constraints', () => {
	const grid = new HexaGrid(3, 3, false);
	const tiles = [3, 3, 3, 1, 9, 1, 3, 3, 3];

	it('Starts with correct possible states', () => {
		const solver = new Solver(tiles, grid);
		let cell = solver.getCell(3);
		expect(cell.possible.size).toBe(5);
		expect([...cell.possible]).toEqual(expect.arrayContaining([1, 2, 4, 16, 32]));
	});

	it('Adds walls to border cells', () => {
		const solver = new Solver(tiles, grid);
		let cell = solver.getCell(0);
		expect(cell.walls).toBe(30);
		cell = solver.getCell(1);
		expect(cell.walls).toBe(6);
		cell = solver.getCell(2);
		expect(cell.walls).toBe(7);
		expect([...solver.dirty]).toEqual(expect.arrayContaining([0, 1, 2]));
	});

	it('Adds full and empty cells to dirty set', () => {
		const solver = new Solver([1, 1, 1, 1, 1, 0, 63, 1, 1, 1, 1, 1], new HexaGrid(4, 3, false));
		let cell = solver.getCell(5);
		expect(cell.walls).toBe(0);
		cell = solver.getCell(6);
		expect(cell.connections).toBe(0);
		expect([...solver.dirty]).toContain(5);
		expect([...solver.dirty]).toContain(6);
	});

	it('Does not add constraints to cells in a wrap puzzle', () => {
		let grid = new HexaGrid(3, 1, true);
		const solver = new Solver([3, 3, 3], grid);
		const cell = solver.getCell(0);
		expect(solver.dirty.size).toBe(0);
	});

	it('Rules out orientations connecting only deadends', () => {
		const solver = new Solver([3, 3, 3, 1, 9, 1, 3, 3, 3], new HexaGrid(3, 3, false));
		const cell = solver.getCell(4);
		expect([...solver.dirty]).toContain(4);
		expect([...cell.possible]).toEqual(expect.arrayContaining([18, 36]));
	});
});

describe('Test solutions check and marking ambiguous tiles', () => {
	it('Detects unsolvable puzzle - quickly from border constraints', () => {
		const grid = new HexaGrid(2, 2, false);
		const tiles = [9, 5, 5, 3];
		const solver = new Solver(tiles, grid);
		const { solvable } = solver.markAmbiguousTiles();
		expect(solvable).toBe(false);
	});

	it('Detects unsolvable puzzle - after some trials', () => {
		const grid = new HexaGrid(2, 2, true);
		const tiles = [1, 5, 5, 3];
		const solver = new Solver(tiles, grid);
		const { solvable } = solver.markAmbiguousTiles();
		expect(solvable).toBe(false);
	});

	it('Detects a small puzzle with a unique solution', () => {
		const grid = new HexaGrid(2, 2, false);
		const tiles = [1, 1, 7, 1];
		const solver = new Solver(tiles, grid);
		const { marked, solvable, unique } = solver.markAmbiguousTiles();
		expect(solvable).toBe(true);
		expect(unique).toBe(true);
		expect(marked).toStrictEqual(expect.arrayContaining([32, 16, 7, 8]));
	});

	it('Detects a larger puzzle with a unique solution', () => {
		const grid = new HexaGrid(2, 3, false);
		const tiles = [1, 1, 15, 1, 1, 3];
		const solver = new Solver(tiles, grid);
		const { marked, solvable, unique } = solver.markAmbiguousTiles();
		expect(solvable).toBe(true);
		expect(unique).toBe(true);
		expect(marked).toStrictEqual(expect.arrayContaining([32, 16, 39, 8, 1, 12]));
	});

	it('Detects a puzzle with multiple solutions', () => {
		const grid = new HexaGrid(3, 3, false);
		const tiles = [1, 5, 1, 1, 62, 3, 1, 5, 1];
		const solver = new Solver(tiles, grid);
		const { marked, solvable, unique } = solver.markAmbiguousTiles();
		expect(solvable).toBe(true);
		expect(unique).toBe(false);
		const a = solver.AMBIGUOUS;
		expect(marked).toStrictEqual(expect.arrayContaining([1, 40, a, 1, a, a, 1, 10, a]));
	});

	it('Detects a wrap puzzle with multiple solutions', () => {
		const grid = new HexaGrid(3, 3, true);
		const tiles = [1, 3, 1, 43, 5, 5, 1, 3, 1];
		const solver = new Solver(tiles, grid);
		const { marked, solvable, unique } = solver.markAmbiguousTiles();
		expect(solvable).toBe(true);
		expect(unique).toBe(false);
		const a = solver.AMBIGUOUS;
		expect(marked).toStrictEqual(expect.arrayContaining([1, 24, a, 43, a, a, 1, 12, a]));
	});

	it('Detects a puzzle with an empty cell and a unique solution', () => {
		const tiles = [3, 9, 5, 5, 0, 1, 3, 9, 1];
		const grid = new HexaGrid(3, 3, false, tiles);
		const solver = new Solver(tiles, grid);
		const { marked, solvable, unique } = solver.markAmbiguousTiles();
		expect(solvable).toBe(true);
		expect(unique).toBe(true);
	});

	it('Detects a wrap puzzle with an empty cell and a unique solution', () => {
		const tiles = [3, 9, 5, 5, 0, 1, 3, 9, 1];
		const grid = new HexaGrid(3, 3, true, tiles);
		const solver = new Solver(tiles, grid);
		const { marked, solvable, unique } = solver.markAmbiguousTiles();
		expect(solvable).toBe(true);
		expect(unique).toBe(true);
	});

	it('Detects a puzzle with many empty cells and a unique solution', () => {
		const tiles = [
			0, 0, 16, 1, 25, 40, 0, 0, 18, 1, 42, 16, 4, 0, 0, 18, 32, 32, 7, 25, 8, 35, 8, 20, 36, 19, 8,
			16, 0, 36, 19, 9, 62, 17, 10, 0, 6, 32, 18, 7, 8, 0, 0, 0, 1, 15, 9, 8, 0
		];
		const grid = new HexaGrid(7, 7, false, tiles);
		const solver = new Solver(tiles, grid);
		const { marked, solvable, unique } = solver.markAmbiguousTiles();
		expect(solvable).toBe(true);
		expect(unique).toBe(true);
	});
});
