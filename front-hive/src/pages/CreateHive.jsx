import { useParams } from 'react-router-dom';

const CreateHive = () => {
    const { hiveName } = useParams();
    
    return (
        <div>
            <h1>Create Hive</h1>
            {hiveName && <p>Hive Name: {hiveName}</p>}
        </div>
    );
};

export default CreateHive;
