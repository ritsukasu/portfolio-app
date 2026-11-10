use('portfolio');

// Create
db.getCollection('projects').insertOne({
  title: 'Weather App',
  category: 'Web',
  tags: ['javascript', 'api'],
  createdAt: Date.now()
});

// Read
db.getCollection('projects').find({ category: 'Web' });

// Update
db.getCollection('projects').updateOne(
  { title: 'Weather App' },
  { $set: { featured: true } }
);

// Delete
db.getCollection('projects').deleteOne({ title: 'Weather App' });