import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/tasks';


function App() {
 
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);
  
  const fetchTasks = async () => {
    console.log('Poslan zahtev za dohvatanje zadataka');
    try {
      const response = await axios.get(API_URL);
      console.log('Odgovor od backend-a: ', response.data);
      setTasks(response.data);
    } catch (error) {
      console.error('Greška prilikom dohvatanja zadataka:', error);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    console.log('Poslan zahtev za dodavanje zadataka');
    
    try {
      const response = await axios.post(API_URL, { title: newTask, completed: false });
      console.log('Odgovor od backend-a: ', response.data);
      setTasks([...tasks, response.data]);
      setNewTask('');
    } catch (error) {
      console.error('Greška prilikom dodavanja zadatka:', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Greška prilikom brisanja zadatka:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>ToDo Lista</h1>
      <input
        type="text"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        placeholder="Unesite novi zadatak"
      />
      <button onClick={addTask}>Dodaj</button>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            {task.title}
            <button onClick={() => deleteTask(task.id)}>Obriši</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
