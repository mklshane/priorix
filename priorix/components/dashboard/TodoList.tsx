import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const initialTodos: Todo[] = [
  {
    id: 1,
    title: "Finish project presentation slides",
    completed: true,
  },
  {
    id: 2,
    title: "Review JavaScript concepts flashcards",
    completed: false,
  },
  {
    id: 3,
    title: "Prepare for client meeting tomorrow",
    completed: false,
  },
];

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTodo, setNewTodo] = useState<string>("");

  const addTodo = (): void => {
    if (newTodo.trim() === "") return;

    const newTodoItem: Todo = {
      id: Date.now(),
      title: newTodo,
      completed: false,
    };

    setTodos([newTodoItem, ...todos]);
    setNewTodo("");
  };

  const toggleTodo = (id: number): void => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  return (
    <Card className="bg-card border-2 border-black py-7 h-100 md:max-h-[317.636px] flex flex-col gap-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-card-foreground text-lg flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Todo List
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Add new todo input */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Add a new task..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={addTodo} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable todo items container */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-3">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    todo.completed
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {todo.completed && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    todo.completed
                      ? "text-muted-foreground line-through"
                      : "text-card-foreground"
                  }`}
                >
                  {todo.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
