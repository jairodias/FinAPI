const express = require('express');
const { v4: uuid } = require("uuid");

const app = express();

app.use(express.json())

const customers = [];

app.post("/account", (request, response) => {
    const { document, name } = request.body;

    const customerAlreadyExists = customers.some((customer) => customer.document === document);

    if (customerAlreadyExists) {
        return response.status(400).json({
            error: "Customer alerady exists."
        });
    }

    customers.push({
        document,
        name,
        id: uuid(),
        statement: []
    });

    return response.status(201).send();
});

app.get("/statement/:document", (request, response) => {
    const { document } = request.params;

    const customer = customers.find((customer) => customer.document === document);

    if (!customer) {
        return response.status(400).json({
            error: "Customer not found."
        });
    }

    return response.json(customer.statement);
});

app.listen(3333);