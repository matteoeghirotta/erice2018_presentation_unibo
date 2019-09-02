export function xyz(data) {
    var lines = data.split('\n');
    var natoms = parseInt(lines[0]);
    var nframes = Math.floor(lines.length/(natoms+2));
    var trajectory = [];
    for(var i = 0; i < nframes; i++) {
        var atoms = [];
        for(var j = 0; j < natoms; j++) {
            var line = lines[i*(natoms+2)+j+2].split(/\s+/);
            var atom = {};
            var k = 0;
            while (line[k] == "") k++;
            atom.symbol = line[k++];
            atom.position = [parseFloat(line[k++]), parseFloat(line[k++]), parseFloat(line[k++])];
            atoms.push(atom);
        }
        trajectory.push(atoms);
    }
    return trajectory;
}


export function ell(data) {
    var lines = data.split('\n');
    var nellipsoids = parseInt(lines[0]);
    var nframes = Math.floor(lines.length/(nellipsoids+2));
    var trajectory = [];
    for(var i = 0; i < nframes; i++) {
        var ellipsoids = [];
        for(var j = 0; j < nellipsoids; j++) {
            var line = lines[i*(nellipsoids+2)+j+2].split(/\s+/);
            var ellipsoid = {};
            var k = 0;
            while (line[k] == "") k++;
            ellipsoid.symbol = line[k++];
            ellipsoid.position = [parseFloat(line[k++]),
				  parseFloat(line[k++]),
				  parseFloat(line[k++])];
	    ellipsoid.q = [parseFloat(line[k++]),
			   parseFloat(line[k++]),
			   parseFloat(line[k++]),
			   parseFloat(line[k++])];

            ellipsoid.shape = [parseFloat(line[k++]),
			       parseFloat(line[k++]),
			       parseFloat(line[k++])];

            ellipsoid.color = [parseFloat(line[k++]),
			       parseFloat(line[k++]),
			       parseFloat(line[k++])];

            ellipsoids.push(ellipsoid);
        }
        trajectory.push(ellipsoids);
    }
    return trajectory;
}
