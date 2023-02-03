const knex = require("../database/knex");
const AppError = require("../utils/AppError");

class NotesController {
    async create(req, res) {
        let { title, description, tags, links } = req.body;
        const user_id = req.user.id;

        const note_id = await knex("notes").insert({
            title,
            description,
            user_id
        });

        if (tags.length < 1) {
            tags = ["", ""]
        } else if (tags.length = 1) {
            tags = [...tags, ""]
        }

        const tagsInsert = tags.map(name => {
            return {
                note_id,
                name,
                user_id
            }
        })
        await knex("tags").insert(tagsInsert)


        if (links.length < 1) {
            links = ["", ""]
        } else if (links.length = 1) {
            links = [...links, ""]
        }

        const linksInsert = links.map(link => {
            return {
                note_id,
                url: link
            }
        });

        await knex("links").insert(linksInsert)




        return res.json("Nota criada com sucesso.");
    }

    async show(req, res) {
        const { id } = req.params;

        const note = await knex("notes").where({ id }).first();
        const tags = await knex("tags").where({ note_id: id }).orderBy("name");
        const links = await knex("links").where({ note_id: id }).orderBy("created_at");

        return res.json({
            ...note,
            tags,
            links
        });

    }

    async delete(req, res) {
        const { id } = req.params

        await knex("notes").where({ id }).delete();

        return res.json("Nota deletada com sucesso.");
    }

    async index(req, res) {
        const { title, tags } = req.query;
        const user_id = req.user.id;

        const note_value = await knex('notes').column('user_id');
        const user_value = await knex('users').column('id');

        let notes;

        let noteExists = (note_value[user_id - 1]);
        let userExists = (user_value[user_id - 1]);


        if (!userExists) {
            throw new AppError("Usuário inexistente.");
        }
        else if (!noteExists) {
            throw new AppError("Nota inexistente.");
        }


        if (tags) {
            const filterTags = tags.split(',').map(tag => tag.trim());

            notes = await knex("tags")
                .select([
                    "notes.id",
                    "notes.title",
                    "notes.user_id"
                ])
                .where("notes.user_id", user_id)
                .whereLike("title", `%${title}%`)
                .whereIn("tags.name", filterTags)
                .innerJoin("notes", "notes.id", "tags.note_id")
                .groupBy("notes.id")
                .orderBy("notes.title");

        } else {
            notes = await knex("notes")
                .where({ user_id })
                .whereLike("title", `%${title}%`)
                .orderBy("title");
        }

        const userTags = await knex("tags").where({ user_id });
        const notesWithTags = notes.map(note => {
            const noteTags = userTags.filter(tag => tag.note_id === note.id);

            return {
                ...note,
                tags: noteTags
            }
        });

        return res.json(notesWithTags);

    }
}

module.exports = NotesController;