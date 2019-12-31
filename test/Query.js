var assert = require('chai').assert,
config = require('./config.json'),
neo4j = require('../lib/Neo4jApi.js'),
util = require('util');

describe('Query', function ()
{
	neo4j.connect(config.server, function (error, graph)
	{
		describe('Graph.Query', function ()
		{
			it('return a result', function (done)
			{
				var cypher = 'MATCH (n) RETURN n LIMIT 1';
				graph.query(cypher, {}, function (error, result)
				{
					assert(!error, error);
					assert.isArray(result, result);
					done();
				});
			});
			it('filter out REST paths from result(s) that include maps and collections', function (done)
			{
				var cypher = 'MATCH (n) RETURN [n] as n1, { n: n }, labels(n) as label, n as node LIMIT 1',
					match = [];
				function traverse(o) {
					if (graph.isNode(o) || graph.isPath(o) || graph.isRelationship(o)) { match.push(true); return true; }
					for (var i in o) {
						if (o.hasOwnProperty(i)) {
							if (typeof o[i] === 'object') {
								if (graph.isNode(o[i]) || graph.isPath(o[i]) || graph.isRelationship(o[i])) {
									match.push(true);
								}
								else {
									//going one step down in the object tree!!
									traverse(o[i]);
								}
							}
							else if (typeof o[i] === 'string' || typeof o[i] === 'number') {
								match.push(true);
							}
							else {
								match.push(false);
							}
						}
					}
				}
				graph.query(cypher, {}, function (error, result)
				{
					traverse(result, process);
					assert(match.indexOf(false) < 0, 'Not all of the results were a relationship, node or path: ' + match);
					done();
				});
			});
		});
	});
});