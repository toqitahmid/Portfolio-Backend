require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("portfolio_db");
    const projectsCollection = db.collection("projects");

    app.post("/api/projects", async (req, res) => {
      try {
        const {
          title,
          description,
          technologies,
          features,
          challenges,
          liveUrl,
          githubUrl,
          imageUrl,
        } = req.body;

        if (
          !title ||
          !description ||
          !technologies ||
          !features ||
          !challenges
        ) {
          return res.status(400).json({
            success: false,
            error: "Required fields are missing",
          });
        }

        const techArray = technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        const featureArray = features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean);
        const challengeArray = challenges
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);

        const project = {
          title,
          description,
          technologies: techArray,
          features: featureArray,
          challenges: challengeArray,
          liveUrl,
          githubUrl,
          imageUrl,
          createdAt: new Date(),
        };

        const result = await projectsCollection.insertOne(project);

        res.status(201).json({
          success: true,
          message: "Project created successfully",
          projectId: result.insertedId,
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: err.message,
        });
      }
    });

    // --------- GET: all projects ----------
    app.get("/api/projects", async (req, res) => {
      try {
        const projects = await projectsCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

        res.status(200).json({
          success: true,
          count: projects.length,
          data: projects,
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // --------- GET: single project by id ----------
    app.get("/api/projects/:id", async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, error: "Invalid project id" });
        }

        const project = await projectsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!project) {
          return res
            .status(404)
            .json({ success: false, error: "Project not found" });
        }

        res.status(200).json({ success: true, data: project });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // --------- PATCH: update project by id ----------
    app.patch("/api/projects/:id", async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, error: "Invalid project id" });
        }

        const {
          title,
          description,
          technologies,
          features,
          challenges,
          liveUrl,
          githubUrl,
          imageUrl,
        } = req.body;

        const updateFields = {};

        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (liveUrl !== undefined) updateFields.liveUrl = liveUrl;
        if (githubUrl !== undefined) updateFields.githubUrl = githubUrl;
        if (imageUrl !== undefined) updateFields.imageUrl = imageUrl;

        if (technologies !== undefined) {
          updateFields.technologies = technologies
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }
        if (features !== undefined) {
          updateFields.features = features
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean);
        }
        if (challenges !== undefined) {
          updateFields.challenges = challenges
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);
        }

        if (Object.keys(updateFields).length === 0) {
          return res
            .status(400)
            .json({ success: false, error: "No fields provided to update" });
        }

        updateFields.updatedAt = new Date();

        const result = await projectsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateFields },
        );

        if (result.matchedCount === 0) {
          return res
            .status(404)
            .json({ success: false, error: "Project not found" });
        }

        res.status(200).json({
          success: true,
          message: "Project updated successfully",
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // --------- DELETE: delete project by id ----------
    app.delete("/api/projects/:id", async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, error: "Invalid project id" });
        }

        const result = await projectsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .json({ success: false, error: "Project not found" });
        }

        res.status(200).json({
          success: true,
          message: "Project deleted successfully",
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run().catch(console.dir);
